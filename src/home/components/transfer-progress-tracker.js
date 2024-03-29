import $browser from "../../background/web.ext.api";
import React, {useState, useMemo, useLayoutEffect, useCallback, useRef} from "react";
import {useRecoilState, useRecoilValue, useSetRecoilState} from 'recoil';
import styled from "styled-components";
import C from "../../background/constant";
import {objectify} from "../../background/utils";
import moment from "moment";
import {vRecentReqkeysData, vErrorDataX, vInfoDataX} from "../atoms.js";
import {VisibleStyleComp} from "./styled.comp.js";
import ErrorHandle from "./error-handle";
import produce from 'immer';

import ErrorOutlineOutlinedIcon from '@material-ui/icons/ErrorOutlineOutlined';
import NewReleasesOutlinedIcon from '@material-ui/icons/NewReleasesOutlined';
import MoreOutlinedIcon from '@material-ui/icons/MoreOutlined';
import ExploreOutlinedIcon from '@material-ui/icons/ExploreOutlined';
import TransactionInfo from './transaction-info';
import CloseSharpIcon from '@material-ui/icons/CloseSharp';


const Transactions = styled(VisibleStyleComp)`
    position: relative;
    display: flex;
    width: 100%;
    height: 100%; 
    display: flex;
    flex-flow: column nowrap;
    left: 0px;
    top: 0px;
    user-select: none;

    >div{
        position: relative;
        display: flex;

        &:nth-of-type(1){
            /* transactions-box */
            flex-flow: row nowrap;
            align-items: flex-start;
            justify-content: center;
            width: 100%;
            height: 600px;
            background-color: #eee;
            color: #666;
            box-sizing: border-box;
        }
    }
`;


const StepProgressBarStyle = styled.div`
    position: relative;
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-between;

    >div:nth-of-type(1){
        position: absolute;
        width: 100%;
        height: 6px;
        background-color: rgba(0,0,0,0.06);
        background-size: 100% 80%;
        top: 50%;
        transform: translateY(-50%);
        z-index: 1;
        border-radius: 1.5px;
        box-sizing: border-box;
        display: flex;
        flex-flow: row nowrap;
        padding-left: 10px;
        padding-right: 10px;

        &:after{
            content: '';
            position: relative;
            height: 100%;
            background: ${p=>p?.color??'black'};
            flex-basis: 0%;
            transition: all 0.24s;

            ${
                (p)=>{
                    if(p.step!==undefined){
                        return `
                            flex-basis: ${ p.progress + '%;'}
                        `
                    }
                }
            }
        }
    }

    >span{
        position: relative;
        z-index: 3;
        width: 13px;
        height: 13px;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        box-shadow: 0px 0px 0px 1px ${p=>p?.color??'black'};
        font-size: 12px;
        font-weight: 600;
        user-select: none;
        transition: all 0.24s;
        background-color: #eee;
        color: #333;

        &:before{
            display: none !important;
        }

        &:nth-of-type(even){
            /* errored */
            opacity: 0;
            background-color: transparent;
            color: black;
            box-shadow: 0px 0px 0px 0px;
            overflow: visible;
            
            &:after{
                opacity: 0;
                pointer-events: none;
                cursor: pointer;
            }

            
            &:not(:last-of-type){
                animation: grow-red 1.666666s ease-in infinite;
            }
        }

        &:nth-of-type(odd){
            &.prevstep,
            &.laststep{
                &:after{
                    content: '✓';
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    width: 100%;
                    height: 100%;
                    background-color: ${p=>p?.color??'transparent'};
                    transform:translate(-50%,-50%);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    line-height: 0;
                    border-radius: 50%;
                }

                &.interrupted{
                    &:after{
                        opacity: 0;
                        pointer-events: none;
                    }
                }
            }
            &.laststep{
                &:not(:last-of-type){
                    animation: grow-yellow 1.666666s ease-in infinite;
                }
            }
        }

        &.prevstep{
            pointer-events: none;
        }

        &.prevstep,
        &.laststep{
            background-color:#009688;
            color: white;
            font-weight: 600;

            svg{
                &.lastStepErrored{
                    z-index: 1;
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%,-50%);
                    background-color: #BA1200;
                    border-radius: 50%;
                    color: #eee;
                    font-weight: bold;
                    font-size: 20px;
                    padding: 2px;
                    cursor: pointer; 
                }
            }
        }

        &.laststep{
            opacity: 1 !important;
            svg{
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%,-50%);
                background-color: #BA1200;
                border-radius: 50%;
                color: #eee;
                font-weight: bold;
                font-size: 20px;
                padding: 2px;
                cursor: pointer; 
            }
        }
        @keyframes grow-yellow {
            0%{ box-shadow: 0px 0px 0px 1px #009688, 0px 0px 0px 2px rgba(255,255,0, 0.66); }
            100%{ box-shadow: 0px 0px 0px 1px #009688, 0px 0px 0px 30px rgba(255,255,255, 0); }
        }
        @keyframes grow-red {
            0%{ box-shadow: 0px 0px 0px 1px #009688, 0px 0px 0px 2px rgba(255,0,0, 0.66); }
            100%{ box-shadow: 0px 0px 0px 1px #009688, 0px 0px 0px 30px rgba(255,255,255, 0); }
        }
    }
`;

const vstep = (d) => (d.step - (d.lastError ? 0.5 : 1)) * 2;
const tstep = (d) => (d.tstep * 2 - 1);

const interrupted = (d, tp = 1000 * 60 * 3) => 
            Date.now() - d.updateTimestamp >= tp && 
                (!d?.responds?.slice(-1)[0]?.result?.error) &&
                     d.success === false && d.finished === false && 
                            d.tstep > d.step && d.lastError === null;

const itemFilter = (d) => {
    if(d.lastError === null) return d;
    if((d?.lastError??'').includes('pact completed')){
        return {...d, lastError: null, step: 5, finished: true, success: true };
    }
    return d;
}

const StepProgressBar = React.memo(({item}) => {
    const isInit = React.useRef(false);
    const [data, setData] = useState(itemFilter(item));
    const [step, setStep] = useState(vstep(data));
    const [steplen] = useState(tstep(data));
    const [reqkey] = useState(data.reqKey);
    const setErrorDataX = useSetRecoilState(vErrorDataX);
    
    const lastStepErrored = useMemo(()=>{
        const isok = (data?.lastError??'').includes("resumePact: pact completed");
        return data.success === false && data.finished === true && !isok;
    }, [data.success, data.finished]);

    useLayoutEffect(()=>{
        if(item.step > 0 && item.step === item.tstep) return;
        const listenerHandler = (message)=>{
            let {type,key,value} = message;
            switch(type){
                case C.FMSG_TRANSFER_PROGRESS: {
                    if(reqkey === key){
                        setData(value);
                        setStep(vstep(value));
                    }
                    break;
                }
            }
            return true;
        }
        if(reqkey !== null && isInit.current === false){
            isInit.current = true;
            $browser.runtime.onMessage.addListener(listenerHandler);
        }
        return ()=>{
            $browser.runtime.onMessage.removeListener(listenerHandler);
        }
    },[reqkey]);

    return <StepProgressBarStyle 
                step={step} 
                color='#009688' 
                progress={Math.min(step / (steplen - 1), 1) * 100} 
            >
                <div></div>
                {
                    new Array(steplen).fill(0).map((v,i,r)=>{

                        if(i % 2){
                            //gots error
                            return <span key={i} 
                                className={step>i ? 'prevstep' : (step===i ? 'laststep' : '') }
                            >
                                {
                                    step >= i && <ErrorOutlineOutlinedIcon 
                                        onClick={()=>{ 
                                            setErrorDataX(produce((s)=>{ 
                                                s.opened = true;
                                                s.message = data.lastError;
                                                s.details = data;
                                            })); 
                                        }}
                                    />
                                }
                            </span>
                        }else{
                            return <span key={i} 
                                className={
                                    (
                                        step>i ? 'prevstep' : (
                                            step===i ? ('laststep' + (interrupted(data) ? ' interrupted' : '')) : '')
                                    ) 
                                }
                            >
                                { Math.ceil((i + 1)/2) }
                                { step === i && interrupted(data) && 
                                    <ErrorOutlineOutlinedIcon className="interrupted" 
                                        onClick={()=>{ 
                                            setErrorDataX(produce((s)=>{ 
                                                s.opened = true;
                                                s.message = "TIME OUT(180secs)  - ERROR";
                                                s.details = data;
                                            })); 
                                        }
                                    }/> 
                                }
                                { r.length - 1 === i 
                                    && lastStepErrored === true 
                                    && <ErrorOutlineOutlinedIcon className="lastStepErrored" /> 
                                }
                            </span>
                        }
                    })
                }
    </StepProgressBarStyle>
});


const Wrapper = styled.div`
    position: relative;
    width: 100%;
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 20px 20px;

    &::-webkit-scrollbar {
        width: 0px;
    }
`;


const StepInfosItem = styled.div`
    position: relative;
    margin-bottom: 20px;
    font-size: 10px;
    color: #666;
    padding: 10px;
    border-radius: 8px;
    background-color: #fff;
    box-shadow: 2px 2px 3px 2px rgba(0,0,0,0.12);
    transition: all 0.18s;
    z-index: 1;
    opacity: 1;

    @keyframes started{
        0%{
            margin-top: -100px;
        }
        100%{
            margin-top: 0px;
        }
    }

    ${
        p=>p.played === true && `
            animation: started 0.3s none;
        `
    }
    

    &:nth-last-of-type(2){
        margin-bottom: 88px;
    }

    >div{
        display: flex;
        flex-flow: row nowrap;
        justify-content: space-between;
        margin-bottom: 3.5px;

        &:last-of-type{
            margin-bottom: 0px;
        }

        >span{
            text-overflow: ellipsis;
            white-space: nowrap;
            font-weight: bold;
            overflow: hidden;
            line-height: 1rem;
 
            &:before{
                content: '•';
                position: relative;
                border-radius: 50%;
                display: inline-flex;
                margin-right: 3px;
            }

            &.txType{
                text-transform: capitalize;
                text-shadow: 0px 0px 1px rgba(0,0,0,1);
            }
        }
        &:nth-of-type(1){
            >span{
                &:nth-of-type(1){
             
                }
                &:nth-of-type(2){

                }
            }
            svg.delete{
                color: #009688;
                cursor: pointer;
                font-size: 16.5px;
                margin-top: -2px;
                margin-right: -3px;
                &:hover{
                    color: #000;
                }
            }
        }
        &:nth-of-type(2){
            >span{

                &:nth-of-type(1){
                    >span{
                        font-weight: bold;
                        align-self: center;
                        &:before{
                            content: '•';
                            position: relative;
                            border-radius: 50%;
                            display: inline-flex;
                            margin-right: 3px;
                        }

                        &:nth-of-type(1){
                        }
                        &:nth-of-type(2){
                            margin-left: 20px;
                        }
                    }

                }
                &:nth-of-type(2){
                    
                }
            }

        }

        &:nth-of-type(3){
            >span{
                &:nth-of-type(1){
                
                }
            }


        }

        &:nth-of-type(4){
            display: flex;
            flex-flow: row nowrap;
            align-items: center;
            
            >*{
                display: flex;
                flex-flow: row nowrap;
                align-items: center;
            }

            >div{
                flex: 1;

            }
            >svg{
                margin-left: 5px;
                color: #009688;
                cursor: pointer;

                &:hover{
                    color: black;
                }

                &:nth-of-type(1){
                    margin-left: 10px;
                }

            }
        }
    }
`;

const NoTransaction = styled.div`
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);

    font-size: 20px;
    white-space: nowrap;
    margin-top: -30px;
    color: rgba(0,0,0,0.36);
    font-weight: bold;
    transition: all 0.18s;

    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    

    ${p=>p.visible===true && `
        opacity: 1;
    `}

    svg{
        font-size: 52px;
        margin-bottom: 20px;
    }

`;


const LoadMoreMark = ({rootRef, style, visibleCallback}) => {
    const $Mark = React.useRef();

    React.useLayoutEffect(()=>{
        if(visibleCallback){
            let options = {
                root: rootRef.current,
                // rootMargin: '0px 0px -90% 0px',
                threshold: 0
            }

            let observer = new IntersectionObserver((entries) => {
                entries.forEach((v) => {
                    if(v.isIntersecting){
                        visibleCallback && visibleCallback();
                    }
                });
            }, options);

            observer.observe($Mark.current);

            return ()=>observer.unobserve($Mark.current);
        }
    },[visibleCallback, rootRef]);

    return <div ref={$Mark} style={{
        position:'relative',
        width:'100%',
        height:'1px',
        ...style
    }}/>
}


export default React.memo(({visible})=>{
    const [reqkeysData, setReqkeysData] = useRecoilState(vRecentReqkeysData);
    const [hasMore, setHasMore] = useState(true);
    const [infoData, setInfoData] = useRecoilState(vInfoDataX);
    const errorData = useRecoilValue(vErrorDataX);
    const rootRef = useRef();
    const topRef = useRef();
    const itemRefs = useRef([]);
    const [txItems, setTxItems] = useState([]);
    const [uniqueItemsObj, setUniqueItemsObj] = useState({});


    useLayoutEffect(()=>{
        setTxItems((txs)=>{
            let x1 = objectify(reqkeysData);
            let x2 = objectify(txs);
            let uniqueObj = {...x1,...x2};
            setUniqueItemsObj(uniqueObj);
            let rt = Object.values(uniqueObj).sort((a,b)=>b.timestamp - a.timestamp);

            if(rt[0] !== undefined) {
                if(rt[0]?.key !== txs[0]?.key){
                    topRef.current.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                    rt[0] = {...rt[0], played: true};
                }
            }
            return rt;
        });
    }, [reqkeysData]);


    const onLoadMore = useCallback(()=>{
        if(hasMore){
            $browser.runtime.sendMessage({
                type: C.MSG_GET_RECENT_REQKEYS_DATA, 
                limit: txItems.length + 5
            }).then((res)=>{
                if(res.length !== reqkeysData.length){
                    setReqkeysData(res);
                }else{
                    setHasMore(false);
                }
            })
        }
    },[txItems, hasMore]);

    const exploreLink = useCallback((reqKey,networkId)=>{
        const networkName = networkId.indexOf("mainnet") > -1 ? 'mainnet' : 'testnet';
        return `https://explorer.chainweb.com/${networkName}/tx/${reqKey}`;
    },[]);

    return <Transactions visible={visible} className='tx-tracker' >
            <div>
                <Wrapper ref={topRef}>
                {
                    txItems.map((v)=>{
                        let {
                            senderAccountName, senderChainId, 
                            receiverAccountName, receiverChainId,
                            txType, networkId, tokenAddress, amount,
                            keys, pred
                        } = v?.param??{};

                        return <StepInfosItem key={v.key} ref={r=>itemRefs.current[v.key]=r} played={v?.played}>
                            <div>
                                <span className='txType'>{v?.param?.txType}</span>
                                <span>Rk: {(v?.reqKey??'').slice(0,8)}</span>
                                <span>{moment(v.timestamp).format("LL - LTS")}</span>
                                <CloseSharpIcon className='delete' onClick={()=>{
                                    if(v?.reqKey){
                                        itemRefs.current[v.key].style='margin-top: -116px; opacity: 0; z-index:0;';
                                        setTimeout(()=>{
                                            $browser.runtime.sendMessage({
                                                type: C.MSG_REMOVE_A_TX_RESULT, 
                                                deleteKey: v.reqKey
                                            }).then((res)=>{
                                                if(res === true){
                                                    delete uniqueItemsObj[v.key];
                                                    setTxItems(Object.values(uniqueItemsObj));
                                                }
                                            });
                                        }, 180);
                                    }
                                }}/>
                            </div>
                            <div>
                                <span>Ta: {tokenAddress}</span>
                                <span>Ni: {networkId}</span>
                                <span style={{maxWidth: '100px'}}>
                                    Mt: {amount||0}
                                </span>
                            </div>
                            <div className={txType}>
                                {(txType === C.TX_SAME_TRANSFER || txType === C.TX_CROSS_TRANSFER) &&
                                    <>
                                        <span>Fr: {senderAccountName.slice(0,12)} - #{senderChainId}</span>
                                        <span>To: {receiverAccountName?.slice(0,12)??senderAccountName.slice(0,12)} - #{receiverChainId??senderChainId}</span>
                                    </>
                                }
                                {txType === C.TX_ROTATE && 
                                    <>
                                        <span>Ac: {senderAccountName.slice(0,8)} - #{senderChainId}</span>
                                        <span title={JSON.stringify({pred,keys})}>
                                            Nw: {pred}, {keys.map(k=>k.slice(0,8)+'..').join(',')}
                                        </span>
                                    </>
                                }
                            </div>
                            <div>
                                <StepProgressBar item={v} />
                                <ExploreOutlinedIcon onClick={()=>{
                                    window.open(exploreLink(v.reqKey, networkId), "_blank")
                                }}/>
                                <MoreOutlinedIcon onClick={()=>{
                                    setInfoData(produce((s)=>{ 
                                        s.opened = true;
                                        s.details = v.param;
                                        s.reqkey = v.reqKey;
                                    })); 
                                }} />
                            </div>
                        </StepInfosItem>
                    })
                } 
                    <LoadMoreMark rootRef={rootRef} visibleCallback={onLoadMore}/>
                </Wrapper>
                <NoTransaction visible={txItems.length===0}>
                    <NewReleasesOutlinedIcon />
                    <div>No Transactions</div>
                </NoTransaction>
                <ErrorHandle visible={(errorData?.opened??false)} errorData={errorData} />
                <TransactionInfo visible={(infoData?.opened??false)} infoData={infoData} />
            </div>
        </Transactions>
});