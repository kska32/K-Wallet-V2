import React,{Suspense, useState, useCallback, useLayoutEffect, useEffect} from "react";
import {RecoilRoot, useRecoilState, useRecoilValue, useSetRecoilState} from 'recoil';
import {
    vPageNumX, vPasswordX, vHasAccount, vIsLoadingX,  
    vGlobalErrorDataX, vReceiverAddrListX, vState, 
    vRecentReqkeysData
} from "./atoms.js";

import C from "../background/constant";
import produce from "immer";

import ReactDOM from 'react-dom/client';
import styled from "styled-components";
import 'semantic-ui-css/semantic.min.css';
import "./index.scss";

import {AlertModal, ConfirmModal, DeleteModal, RotateModal} from "./components/special-modals";
import CreateWalletInit from "./components/create-wallet-init.js";
import CreateWalletUnlock from "./components/wallet-lock-page.js";
import CreateWalletStepper from "./components/create-wallet-stepper.js";
import WalletDashboard from "./components/wallet-dashboard.js";
import ImportWalletStepper from "./components/import-wallet-stepper.js";
import transfer from "../background/transaction";
import {LoadingBox} from "./components/loadingBox";
import InitTimerNode,{KdaPriceTick, AutoLocker} from "../background/timer-node";
window.transfer = transfer; 

const Wrapper = styled.div`
    position: relative;
    width: 100%;
    min-height: 100%;
    display: flex;
    box-sizing: border-box;
    min-width: 1280px;
    
`;


export const Main = React.memo((props)=>{
    const syncBackgroundState = useSetRecoilState(vState);
    const [pageNum, setPageNum] = useRecoilState(vPageNumX);
    const hasAccount = useRecoilValue(vHasAccount);
    const password = useRecoilValue(vPasswordX);
    const [isLoading,setLoading] = useRecoilState(vIsLoadingX);
    const setGErrData = useSetRecoilState(vGlobalErrorDataX);
    const setReceiverAddrList = useSetRecoilState(vReceiverAddrListX);
    const setReqkeysData = useSetRecoilState(vRecentReqkeysData);

    useEffect(()=>{
        InitTimerNode();
        KdaPriceTick();
        AutoLocker();
    },[]);

    useLayoutEffect(()=>{
        chrome.runtime.onMessage.addListener(async (msg,sender,sendResponse)=>{
            switch(msg.type){
                case C.FMSG_SYNC_BACKGROUND_STATE:{
                    delete msg.type;
                    syncBackgroundState((s)=>({...s, ...msg}));
                    break;
                }
                case C.FMSG_TRANSFER_PROGRESS: {
                    switch(msg.value.step){
                        case 0:{
                            setGErrData(produce((s)=>{
                                s.opened = true;
                                s.message = msg.value.lastError;
                            }));
                            setLoading({
                                opened: false, 
                                text: null,
                                timestamp: null
                            });
                            break;
                        }
                        case 1:{
                            chrome.runtime.sendMessage({
                                type: C.MSG_GET_RECENT_REQKEYS_DATA, 
                                limit: 1
                            }, (res) => { 
                                setReqkeysData(res); 
                            });
                            break;
                        }
                    }
                    break;
                }
                case C.FMSG_RECEIVER_ADDR_LIST_UPDATED: {
                    setReceiverAddrList(msg.receiverAddrList);
                    break;
                }
            }
            return true;
        });
    }, []);

    useLayoutEffect(()=>{
        if(hasAccount === true){
            if(!!password === false){
                setPageNum(5);
            }else{
                setPageNum(pageNum<=8 ? 8 : pageNum);
            }
        }
    }, [hasAccount, password]);

    const changeAccountKeysetOnSubmit = useCallback(function({
        senderAccountName, senderChainId, keys, pred
    }){
        chrome.runtime.sendMessage({
            type: C.MSG_CHANGE_ACCOUNT_KEYSET,
            ...arguments[0]
        });
    }, []);


    return <Wrapper>
        {pageNum === 0 && <CreateWalletInit />}
        {pageNum >= 1 && pageNum <= 4 && <CreateWalletStepper />}
        {pageNum >= 6 && pageNum <= 7 && <ImportWalletStepper />}
        <WalletDashboard visible={pageNum >= 8} />
        <CreateWalletUnlock visible={pageNum === 5}/>
        <LoadingBox 
            isLoading={isLoading?.opened} 
            loadingText={isLoading?.text} 
            timestamp={isLoading?.timestamp??null}
        />
        <AlertModal />
        <ConfirmModal />
        <DeleteModal />
        <RotateModal onSubmit={changeAccountKeysetOnSubmit} />
    </Wrapper>
});


ReactDOM.createRoot(document.getElementById('root')).render(
    <RecoilRoot>
        <Suspense fallback={<LoadingBox isLoading={true} />}>
            <Main/>
        </Suspense>
    </RecoilRoot>
);





/********************************************************* */


console.log("await window.kwalletv2.getAccountName();// request account name.");
console.log("await window.kwalletv2.getSignature(signingCmd); //generate signature.");

console.log(`const Example_SigningCmd = {
    "pactCode": "(coin.transfer-crosschain \"k:b8559cae02d291fbff2425511b040aaae606bd8e5edf6a2c16fe7529f6ab77f2\" \"k:b8559cae02d291fbff2425511b040aaae606bd8e5edf6a2c16fe7529f6ab77f2\" (read-keyset \"kw-keyset\") \"1\" 100.123)",
    "envData": {
        "kw-keyset": {
            "pred": "keys-all",
            "keys": [
                "b8559cae02d291fbff2425511b040aaae606bd8e5edf6a2c16fe7529f6ab77f2"
            ]
        }
    },
    "caps": [
        {
            name: "coin.TRANSFER_XCHAIN",
            args: ["k:b8559cae02d291fbff2425511b040aaae606bd8e5edf6a2c16fe7529f6ab77f2", "k:b8559cae02d291fbff2425511b040aaae606bd8e5edf6a2c16fe7529f6ab77f2", +100.123, "1"]
        },
        {
            name: "coin.GAS",
            args: []
        }
    ],
    "networkId": "mainnet01",
    "publicKey": "b8559cae02d291fbff2425511b040aaae606bd8e5edf6a2c16fe7529f6ab77f2",
    "ttl": 28800,
    "gasLimit": 600,
    "chainId": "13",
    "gasPrice": 1e-8,
    "sender": "k:b8559cae02d291fbff2425511b040aaae606bd8e5edf6a2c16fe7529f6ab77f2"
};`
);