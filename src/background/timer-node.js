import {createTimer, createReqLogger, StateManager, sendMessageErrHandle} from "./utils";
import {
    senderReqkeyAlarmDB, receiverReqkeyAlarmDB, 
    proofAlarmDB, continueTransferAlarmDB, 
    userOptionsDB, keypairsDB
} from './localdb';
import createTransfer from "./transaction";
import * as ccxt from "ccxt";
import C,{BackgroundState} from "./constant";
const deepCopy = o => JSON.parse(JSON.stringify(o));

async function createTimerNode(infs){
    infs.forEach((inf,ix)=>{
        const {name, when, interval, handler} = inf;
        createTimer(name, when, interval, async(name, alarmName)=>{
            const dbs = {senderReqkeyAlarmDB, proofAlarmDB, receiverReqkeyAlarmDB, continueTransferAlarmDB};
            const db = dbs[alarmName + 'DB'];
            handler(db, alarmName, name);
        });
    });
}

export async function KdaPriceTick(){
    createTimer('kdapriceTick', 0, 10, async(name, alarmName)=>{
        try{
            let exchange = new ccxt.binance();
            let exchangeResponse = await exchange.fetchTicker('KDA/USDT');
            await StateManager.set({kdausdt: exchangeResponse?.last??0});
        }catch(err){
            //console.error(err);
        }
    })
}

export async function AutoLocker(){
    const fieldName = 'autoLockupTime';
    const defaultLimitTime = 1000 * 60 * 10; //default idle time.
   
    createTimer('AutoLocker', 0, 5, async () => {
        try{
            let rt = await userOptionsDB.getItem(fieldName);
            if(rt === undefined){
                await userOptionsDB.upsertItem(fieldName, {
                    [fieldName]: {
                        endTime: Date.now() + defaultLimitTime, 
                        limitTime: defaultLimitTime
                    }
                });
            }else{
                let {autoLockupTime: {endTime, limitTime}} = rt;
                let percent = Math.max( +((endTime - Date.now()) / limitTime * 100).toFixed(2), 0 );

                if(percent===0){
                    const {pageNum, networkId} = await StateManager.get([
                        'pageNum',
                        'networkId'
                    ]);
                    if(pageNum >= 8){
                        await StateManager.set({
                            ...deepCopy(BackgroundState), 
                            pageNum: 5, 
                            networkId
                        });
                    }
                }else{
                    chrome.runtime.sendMessage({
                        type: C.FMSG_LOCK_PROGRESS_STATE, 
                        value: percent 
                    },sendMessageErrHandle);
                }
            }
        }catch(err){

        }
    });

    let lastedTime = 0;
    const detectActiveHandle = ()=>{
        if(Date.now() - lastedTime >= 3000){
            lastedTime = Date.now();
            userOptionsDB.getItem(fieldName).then((res)=>{
                const limitTime = res?.autoLockupTime?.limitTime??0;
                if(limitTime){
                    userOptionsDB.upsertItem(fieldName, {
                        [fieldName]: {
                            limitTime,
                            endTime: Date.now() + limitTime
                        }
                    });
                }
            });
        }
    }
    ['mousemove','click','mousedown'].map((eventname)=>
            window.addEventListener(eventname, detectActiveHandle));

}



export default async function InitTimerNode(){
    createTimerNode([
        {
            name: 'senderReqkeyAlarm',
            interval: 5,
            when: 0,
            handler: async (db, alarmName)=>{
                let list = await db.getAll();

                list.forEach( async(v,i)=>{
                    const {key, param, count, maxCount, responds} = v;
                    const senderReqkey = key;
                    const senderChainId = v.param.senderChainId;
                    const crlogger = createReqLogger(senderReqkey, param, responds);

                    try{
                        const cct = createTransfer(param);
                        const senderListenResult = await cct.selectReqkey(senderReqkey, senderChainId);

                        if(count > maxCount) throw "TIMEOUT";
                        if(senderListenResult === null){
                            await db.upsertItem(senderReqkey, {count: count+1});
                        }else{
                            const newResponds = [...responds, senderListenResult];
                            await crlogger.set(newResponds);
                            switch(v.param.txType){
                                case C.TX_CROSS_TRANSFER: {
                                    await proofAlarmDB.upsertItem(senderReqkey, {
                                        count: 0, maxCount, param, responds: newResponds
                                    });
                                    break;
                                }
                            }
                            await db.deleteByKey(senderReqkey);
                        }
                    }catch(err){
                        await crlogger.err(err);
                        await db.deleteByKey(senderReqkey);
                    }
                })
                
            }
        },
        {
            name: 'proofAlarm',
            interval: 5,
            when: 1,
            handler: async(db, alarmName)=>{
                let list = await db.getAll();

                list.forEach( async(v,i)=>{
                    const {key, param, count, maxCount, responds} = v;
                    const senderReqkey = key;
                    const crlogger = createReqLogger(senderReqkey, param, responds);

                    try{
                        if(count > maxCount) throw "TIMEOUT";
                        const cct = createTransfer(param);
                        const spvCmd = cct.createSpvCmd(responds[responds.length-1]);
                        const proof = await cct.fetchProof(spvCmd);

                        if(proof === null){
                            await db.upsertItem(senderReqkey, {count: count+1});
                        }else{
                            const newResponds = [...responds, proof];
                            await crlogger.set(newResponds);
                            await continueTransferAlarmDB.upsertItem(senderReqkey, {
                                count: 0, maxCount, param, responds: newResponds
                            });
                            await db.deleteByKey(senderReqkey);
                        }
                    }catch(err){
                        await crlogger.err(err);
                        await db.deleteByKey(senderReqkey);
                    }
                });
                
            }
        },
        {
            name: 'continueTransferAlarm',
            interval: 5,
            when: 2,
            handler: async(db, alarmName)=>{
                let list = await db.getAll();

                list.forEach( async(v,i)=>{
                    const {key, param, count, maxCount, responds} = v;
                    const senderReqkey = key;
                    const proof = responds[responds.length-1];
                    const receiverChainId = param.receiverChainId;
                    const crlogger = createReqLogger(senderReqkey, param, responds);
                    
                    try{
                        if(count > maxCount) throw "TIMEOUT";
                        const cct = createTransfer(param);
                        let receiverReqkeyResult = await cct.continueTransfer(senderReqkey, proof, 1, receiverChainId);
                        const newResponds = [...responds, receiverReqkeyResult];
                        await crlogger.set(newResponds);
                        await receiverReqkeyAlarmDB.upsertItem(senderReqkey, {
                            count: 0, maxCount, param, responds: newResponds
                        });
                        await db.deleteByKey(senderReqkey);

                    }catch(err){
                        await crlogger.err(err);
                        await db.deleteByKey(senderReqkey);
                    }
                });
            }
        },
        {
            name: 'receiverReqkeyAlarm',
            interval: 5,
            when: 3,
            handler: async(db, alarmName)=>{
                let list = await db.getAll();

                list.forEach( async(v,i)=>{
                    const {key, param, count, maxCount, responds} = v;
                    const senderReqkey = key;
                    const receiverReqkey = responds[responds.length-1].requestKeys[0];
                    const receiverChainId = param.receiverChainId;
                    const crlogger = createReqLogger(senderReqkey, param, responds);

                    try{
                        const cct = createTransfer(param);
                        const receiverListenResult = await cct.selectReqkey(receiverReqkey, receiverChainId);

                        if(count > maxCount) throw "TIMEOUT";
                        if(receiverListenResult === null){
                            await db.upsertItem(senderReqkey, {count: count+1});
                        }else{
                            const newResponds = [...responds, receiverListenResult];
                            await crlogger.set(newResponds);
                            await db.deleteByKey(senderReqkey);
                        }
                    }catch(err){
                        await crlogger.err(err);
                        await db.deleteByKey(senderReqkey);
                    }
                })
            }
        }
    ]);
}








