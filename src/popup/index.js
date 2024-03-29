import $browser from "../background/web.ext.api";
import React,{Suspense, useState, useLayoutEffect} from "react";
import ReactDOM from 'react-dom/client';
import styled from "styled-components";
import "./index.scss";

import LockupPage from "../home/components/wallet-lock-page";
import { sha512 } from '../background/utils';
import { RecoilRoot, useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';

import C from "../background/constant";
import { MsgidTabidHashState, vPasswordX, vHasAccount, vIsLoadingX, vState } from "../home/atoms.js";
import { GetAccountAddr } from "./getAccountAddr";
import { GetSignature } from "./getSignature";
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import { AutoLocker } from "../background/timer-node";
import {LoadingBox} from "../home/components/loadingBox";
import BlockIcon from '@material-ui/icons/Block';


const Nothing = styled.div`
    position: fixed;
    width: 100%;
    height: 100%;
    background-color: #000;
    color: #fff;
    font-size: 36px;
    font-weight: bold;
    display: flex;
    justify-content: center;
    align-items: center;
    color: red;

    svg{
        font-size: 86px;
        color: white;
    }
`;


const HasNoAccountAlertWrapper = styled.div`
    position: fixed;
    width: 100%;
    height: 100%;
    background-color: rgba(255,255,255,0.1);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;

    >div{
        width: 90%;
        height: 100px;
        box-shadow: 5px 5px 0px 0px rgba(255,255,255,0.5);
        background-color: rgba(255,255,255,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        flex-flow: column nowrap;

        &:after{
            content: 'No Account';
            color: rgba(0,0,0,0.5);
            font-weight: 700;
            font-size: 18px;
        }

        >svg{
            font-size: 64px;
            color: rgba(0,0,0,0.5);
        }

    }
`;

const HasNoAccountAlert = ()=>{
    return <HasNoAccountAlertWrapper>
        <div>
            <BlockIcon />
        </div>
    </HasNoAccountAlertWrapper>
}


const Main = React.memo(() => {
    const syncBackgroundState = useSetRecoilState(vState);
    const password = useRecoilValue(vPasswordX);
    const hasAccount = useRecoilValue(vHasAccount);
    const isLoading = useRecoilValue(vIsLoadingX);
    const [msgTabHahsId, setMsgTabHashId] = useRecoilState(MsgidTabidHashState);
    const [pageType, setPageType] = useState("");

    useLayoutEffect(() => {
        if(!!password){
            const u = new URL(location.href);
            const qs = (k) => (u.searchParams.get(k)??'').replace(/ /gi, '+');
            const origin = qs('origin');
            const messageId = qs('messageId');
            const tabId = +qs('tabId');
            const hash = sha512(JSON.stringify({messageId, password}));
            const dataType = qs('dataType');
            let dataParam = JSON.parse(atob(qs('dataParam')));
            setMsgTabHashId({origin, messageId, tabId, hash, dataType, dataParam});
        }
    }, [password, location.href]);


    useLayoutEffect(()=>{
        AutoLocker();
        $browser.runtime.onMessage.addListener((msg,sender)=>{
            const {type} = msg;
            switch(type){
                case C.FMSG_SYNC_BACKGROUND_STATE:{
                    delete msg.type;
                    syncBackgroundState((s)=>({...s, ...msg}));
                    break;
                }
            }
            return true;
        });
    }, []);


    useLayoutEffect(()=>{
        setPageType(msgTabHahsId.dataType);
    }, [msgTabHahsId.dataType]);


    return <div>
        <LockupPage visible={!password} style={{zIndex: 100}} />
         {
            {
                'accountName': <GetAccountAddr />,
                'signature': <GetSignature />
            }[pageType]??<Nothing><ErrorOutlineIcon/></Nothing>
        }
        <LoadingBox 
            isLoading={isLoading?.opened} 
            loadingText={isLoading?.text} 
            timestamp={isLoading?.timestamp??null}
        />
        {hasAccount !== true && <HasNoAccountAlert />}
    </div>
});


ReactDOM.createRoot(document.getElementById('root')).render(
    <RecoilRoot>
        <Suspense fallback={<LoadingBox isLoading={true} />}>
            <Main />
        </Suspense>
    </RecoilRoot>
);


