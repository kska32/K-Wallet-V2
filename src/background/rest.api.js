import createTransfer from "./transfer";
import {reqkeysDB, senderReqkeyAlarmDB, alarmDbs} from "./localdb";
import C from "./constant";
import {createReqLogger, SendErrorMessage} from "./utils";


export default function(){
    const MAX_COUNT = 60;

    async function samechainTransfer({
        senderAccountName,
        keypairs,
        receiverAccountName,
        amount,
        senderChainId,
        receiverChainId,
        gasPrice,
        gasLimit,
        networkId,
        tokenAddress
    }){
        let crlogger = null;
        let senderReqkey = null;

        let param = {...arguments[0], keypairs: {...arguments[0].keypairs}};
        delete param.keypairs.secretKey;

        gasLimit = Math.min(Math.max(C.MIN_GAS_LIMIT, +gasLimit), C.MAX_GAS_LIMIT);
        gasPrice = Math.min(Math.max(C.MIN_GAS_PRICE, +gasPrice), C.MAX_GAS_PRICE);

        let cct = createTransfer({...arguments[0], gasLimit, gasPrice});

        try{
            let details = await cct.getAcctDetails(receiverAccountName, receiverChainId);
            let senderReqkeyResult = await cct.transferSamechain(details.guard);
                   
            senderReqkey = senderReqkeyResult.requestKeys[0];
            crlogger = createReqLogger(senderReqkey, param); 
            await crlogger.set([senderReqkeyResult]);
            await senderReqkeyAlarmDB.upsertItem(senderReqkey, {
                count: 0, maxCount: MAX_COUNT, param, responds: [senderReqkeyResult]
            });
        }catch(err){
            if(crlogger !== null){
                crlogger.err(err);
            }else{
                SendErrorMessage('transfer-create', 2, err, param);
            }
            throw err;
        }
    
    }
    
    async function crosschainTransfer({
        senderAccountName,
        keypairs,
        receiverAccountName,
        amount,
        senderChainId,
        receiverChainId,
        networkId,
        tokenAddress,
        gasPrice = 0.00000001,
        gasLimit = 400,
        xGasPrice = 0.00000001,
        xGasLimit = 400
    }){
        let crlogger = null;
        let senderReqkey = null;

        let param = {...arguments[0], xGasPrice, keypairs: {...arguments[0].keypairs}};
        delete param.keypairs.secretKey;

        let cct = createTransfer({...arguments[0], xGasPrice});

        try{
            let details = await cct.getAcctDetails(receiverAccountName, receiverChainId);
            let senderReqkeyResult = await cct.transferCrosschain(details.guard);
                    
            senderReqkey = senderReqkeyResult.requestKeys[0];
            crlogger = createReqLogger(senderReqkey, param);
            await crlogger.set([senderReqkeyResult]);
            await senderReqkeyAlarmDB.upsertItem(senderReqkey, {
                count: 0, maxCount: MAX_COUNT, param, responds: [senderReqkeyResult]
            });
        }catch(err){
            if(crlogger !== null){
                crlogger.err(err);
            }else{
                SendErrorMessage('transfer-crosschain', 5, err, param);
            }
            throw err;
        }
    }

    
    async function justTransfer({
        senderAccountName,
        keypairs,
        receiverAccountName,
        amount,
        senderChainId,
        receiverChainId,
        tokenAddress,
        networkId,
        xGasPrice,
        xGasLimit
    }){
        try{
            const fn = (senderChainId===receiverChainId ? samechainTransfer : crosschainTransfer);
            return await fn(arguments[0]);
        }catch(err){
            throw err;
        }
    }

    async function continueErrorTransfer(reqkey){
        const d = await reqkeysDB.getItem(reqkey);
        const {param, lastError, key:senderReqkey} = d;

        let {responds, continueCount = 0} = d;
        const crlogger = createReqLogger(senderReqkey, param, responds);

        try{
            console.error("Continue-Transfer - lastError:> ", lastError);
            if(continueCount < 3){
                continueCount++;
            }else{
                responds = responds.slice(0,2);
                continueCount = 0;
            }
            await reqkeysDB.upsertItem(reqkey, {lastError: null, continueCount});
            await crlogger.set(responds);
            await alarmDbs[responds.length - 1].upsertItem(senderReqkey, {count: 0, maxCount: MAX_COUNT, param, responds});
            return true;
        }catch(err){
            SendErrorMessage('continue.no.conn.transfer', 0, err, param);
            throw err;
        }
    }

    async function getAcctDetailsForAllChains(accountAddr, networkId, tokenAddress){
        let param = {accountAddr, tokenAddress, networkId};
        try{
            let cct = createTransfer({ networkId, tokenAddress });
            return await cct.getFullAcctDetails(accountAddr);
        }catch(err){
            SendErrorMessage('coin.details', 0, err, param);
            throw err;
        }
    }


    async function initAccountForAnyChains(accountAddr, nullChainIds = [], networkId = 'testnet04'){
        let cct = createTransfer({
            senderAccountName: accountAddr,
            networkId
        });
        let param = {accountAddr, nullChainIds, networkId};
        try{
            return await Promise.all(
                nullChainIds.map(cid =>
                    cct.initAccount(cid).then((r1)=>{
                        return cct.listenReqkey(r1.requestKeys[0], cid);
                    })
                )
            );
        }catch(err){
            SendErrorMessage('account.initiate', 0, err, param);
            throw err;
        }
    }

    async function searchFungibleV2token(networkId='mainnet01'){
        try{
            let cct = createTransfer({networkId});
            let finalrt = await Promise.all(new Array(20).fill(0).map((v,i)=>cct.listModules(i)));
    
            finalrt.sort((a, b) => b.moduleNames.length - a.moduleNames.length);
    
            let ee = finalrt.reduce((a,c,i)=>{
                a.all = [...a.all, ...c.moduleNames]; 
                a.intersect = (i === 0 ? c.moduleNames : a.intersect.filter(ax=>c.moduleNames.includes(ax)));
                a.chainidRanking.push(c.chainId);
                a.lengthRanking.push(c.moduleNames.length);
                return a;
            }, {
                all: [],
                intersect: [],
                chainidRanking: [],
                lengthRanking: []
            });
    
            ee.unique = [...new Set(ee.all)];
            let describes = await Promise.all([...ee.intersect]
                .map((moduleName)=>cct.describeModule(moduleName, ee.chainidRanking.slice(-1)[0]??0)));
            let x = describes.filter((de) => 
                (de.data?.interfaces?.length??0) > 0 && de.data?.interfaces[0] === "fungible-v2")
                .map(v=>v.data.name);

            ee.fungibleV2 = x;
            return ee;
        }catch(err){
            console.log("--->error:>", err);
            return null;
        }
    }


    function reqSign({
        keypairs,
        code, data, sender, 
        chainId, 
        caps, gasPrice, gasLimit, 
        ttl, networkId
    }){
        //let keypairs = {
        //    publicKey: '',
        //    secretKey: ''
        //};
        const cct = createTransfer({keypairs});
        const signature = cct.genSignature({...arguments[0]});
        return signature;
    }

    return {
        getAcctDetailsForAllChains,
        initAccountForAnyChains,
        samechainTransfer,
        crosschainTransfer,
        justTransfer,
        continueErrorTransfer,
        searchFungibleV2token,
        reqSign
    }
}






