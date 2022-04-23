import React, {useState, useLayoutEffect, useCallback, useEffect} from "react";
import {useRecoilState, useRecoilValue, useSetRecoilState} from 'recoil';
import styled from "styled-components";
import C from "../../background/constant";

import {
    vNetworkIdX, vLockupX, vAccAddrX, vAccountDetailsX, 
    vPageNumX, vSidebarOpenedX, vKdaPriceX, 
    vTokenAddressX, vTokenAddressListX, vIsDarkX
} from "../atoms.js";

import {VisibleStyleComp} from "./styled.comp.js";
import CoinSender from "./coin-sender.js";
import AccountDetails from "./account-details.js";
import ProgressTracker from "./transfer-progress-tracker";
import Sidebar from "./sidebar";

import {NetDropdown, ToggleButton} from "./special-buttons";
import MenuIcon from '@material-ui/icons/Menu';

import LockIcon from '@material-ui/icons/Lock';
import SyncIcon from '@material-ui/icons/Sync';

const Wrapper = styled.div`
    position: absolute;
    width: 100%;
    min-height: 100%;
    left: 0px;
    top: 0px;

    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    align-items: center;

    opacity: 0;
    pointer-events: none;
    transition: all 0.24s;

    ${
        p => p.visible && `
            pointer-events: initial;
            opacity: 1;
        `
    }

    >div{
        position: relative;
        width: 100%;
        display: flex;
    }

    .lock-button,
    .refresh-button{
        position: fixed;
        right: 20px;
        bottom: 20px;

        width: 40px;
        height: 40px;
        z-index: 390;
        background-color: rgba(0,0,0,0.5);

        >svg{
            font-size: 24px;
            color: #eee;
        }

        &:hover{
            >svg{
                color: #333;
            }
            background-color: #eee;
        }
    }

    .refresh-button{
        bottom: 70px;
    }

    .lock-button{
        .lock-progress{
            position: absolute !important;
            left: 50%;
            top: 50%;
            transform: translate(-50%,-50%);
            width: 100%;
            height: 100%;


        }
    }

`;

const Body = styled.div`
    position: relative;
    flex-flow: column nowrap;
    background-color: #fff;
    background-color: #6ED6E4;
    flex: 1;
`;

const Navbar = styled.div`
    position: relative;
    display: flex;
    background-color: rgba(255,255,255,0.25);
    z-index: 365;
    width: 100%;
    flex-flow: row nowrap;
    padding: 15px 18px;
    height: 66px;

    align-items: flex-start;
    justify-content: flex-start;

    >span{
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        margin-right: 20px;
        user-select: none;

        &:nth-of-type(1){
            display: flex;
            justify-content: flex-start;
            align-items: flex-start;
            flex-flow: row nowrap;

            >span{
                position: relative;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                background-color: #fff;
                cursor: pointer;
                box-shadow: 0px 0px 3px 2px rgba(0,0,0,0.16);
                transition: all 0.24s;
                
                svg{
                    font-size: 23px;
                }

                &:hover{
                    transform: scale(1.08);
                    box-shadow: 0px 0px 3px 2px rgba(0,0,0,0.24);
                }
            }
        }
        &:nth-of-type(2){
            margin-top: 3px;
        }
        &:nth-of-type(3){
            margin-top: 3px;
        }
        &:nth-of-type(4){
            font-weight: 500;
            font-size: 16px;
            color: #fff;
            height: 100%;
        }

    }
`;


const Dashboard = styled.div`
    position: relative;
    flex: 1;
    display: flex;
    left: 0px;
    top: 0px;
    flex-flow: row wrap;
    justify-content: space-around;
    align-items: center;
    background-color: #6ED6E4;

    @media (min-width: 2048px) {
        zoom: 150%;
    }
   
    @media (max-width: 1920px) {
        zoom: 120%;
    }

    @media (max-width: 1707px) {
        zoom: 110%;
    }

    @media (max-width: 1536px) {
        zoom: 100%;
    }

`;


const CircleButton = styled.section`
    position: relative;
    cursor: pointer;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    justify-content: center;
    align-items: center;
    
    opacity: 1;
    box-shadow: 1px 1px 3px 2px rgba(0,0,0,0.16);
    margin-left: 10px;
    
    background-color: #fff;
    color: #333;

    transition: all 0.18s;
 
    &:nth-of-type(1){
        margin-left: 0px;
    }

    &:hover{
        background-color: #333;
        color: #fff;
    }

    &.active{
        background-color: #333;
        color: #fff; 
    }
`;


const LockProgressBarStyle = styled.div`
    position: fixed;
    width: 100%;
    height: 6px;
    background-color: transparent;
    bottom: 0px;
    z-index: 3000;
    pointer-events: none;
    opacity: 0.68;

    >div.bar{
        position: relative;
        width: 100%;
        height: 100%;
        background: #00F260; 
        background: -webkit-linear-gradient(to right, #0575E6, #00F260);  
        background: linear-gradient(to right, #0575E6, #00F260);
        transition: all ${p=>p.interval||5}s;
        border-top: 3px solid white;
    }
`;

export function LockProgressBar({className, ...props}){
    const [pstate, setPstate] = useState(100);

    useLayoutEffect(()=>{
        const fn = (msg)=>{
            if(msg.type === C.FMSG_LOCK_PROGRESS_STATE){
                setPstate(msg.value);
            }
            return true;
        };
        chrome.runtime.onMessage.addListener(fn);

        return ()=>{
            chrome.runtime.onMessage.removeListener(fn);
        }
    }, []);

    return <LockProgressBarStyle interval={5} className={className} id='lock-progress-bar' >
        <div className='bar' style={{width: pstate + '%'}}></div>
    </LockProgressBarStyle>
}


export default function({visible}){
    const accountAddr = useRecoilValue(vAccAddrX);
    const accountDetails = useRecoilValue(vAccountDetailsX);
    const lockUp = useSetRecoilState(vLockupX);
    const [interActionNo, setInterActionNo] = useRecoilState(vPageNumX);
    const [networkId, setNetworkId] = useRecoilState(vNetworkIdX);
    const [sidebarOpened, setSidebarOpened] = useRecoilState(vSidebarOpenedX);
    const kdausdt = useRecoilValue(vKdaPriceX);
    const [tokenAddressList, setTokenAddressList] = useRecoilState(vTokenAddressListX);
    const [tokenAddress, setTokenAddress] = useRecoilState(vTokenAddressX);
    const [isDark, setDark] = useRecoilState(vIsDarkX);

    useLayoutEffect(()=>{
        chrome.runtime.sendMessage({
            type: C.MSG_GET_FUNGIBLE_V2_TOKEN_LIST,
            networkId,
            tokenAddress
        });
    },[networkId,tokenAddress]);

    const onNetworkChange = useCallback((v)=>{
        setNetworkId(v);
    },[]);

    const onTokenAddressChange = useCallback((v,item)=>{
        setTokenAddress(v);
    },[]);

    const refreshAccountDetails = useCallback(()=>{
        chrome.runtime.sendMessage({
            type: C.MSG_GET_ACCOUNT_DETAILS, 
            accountId: accountAddr
        });       
    },[accountAddr, networkId]);


    useLayoutEffect(()=>{
        let t = document.querySelector('#root');
        t.classList[isDark ? 'add' : 'remove']('dark');
    }, [isDark]);

    return <Wrapper visible={visible} >
       <Body className='xBody'>
            <Navbar className='xNavbar'>
                <span>
                    <span className='MenuButton' onClick={()=>setSidebarOpened(true)}>
                        <MenuIcon />
                    </span>
                </span>
                <span>
                    <NetDropdown options={[
                            {key: 0, text:'Mainnet', value:'mainnet01'},
                            {key: 1, text:'Testnet', value:'testnet04'},
                            //{key: 2, text:'localhost:8080', value:'localhost:8080'}
                        ]} 
                        key={networkId}
                        defaultValue={networkId} 
                        style={{minWidth:'136px'}}
                        onChange={onNetworkChange} 
                    />
                </span>
                <span>
                    <NetDropdown options={tokenAddressList.map((c,i)=>({key: i, text:c, value:c}))}
                        key={tokenAddress}
                        defaultValue={tokenAddress}
                        style={{minWidth:'136px'}}
                        onChange={onTokenAddressChange}
                        refreshOnClick={async()=>{
                            const rt = await chrome.runtime.sendMessage({
                                type: C.MSG_UPDATE_FUNGIBLE_V2_TOKEN_ADDR_LIST
                            });   
                            setTokenAddressList(rt.fungibleV2);
                        }}
                    />
                </span>
                <span className='prices'>{(accountDetails?.sum??0).toFixed(4)} - ${(kdausdt * (accountDetails?.sum??0)).toFixed(4)} - ${kdausdt}</span>
                <ToggleButton key={isDark} value={isDark} onChange={(s)=>setDark(s)}/>
            </Navbar>
            <Dashboard className='xDashboard'>
                <AccountDetails details={(accountDetails?.details??[])} accountAddr={accountAddr} visible={interActionNo === 9} />
                <CoinSender visible={interActionNo === 10} />
                <ProgressTracker visible={interActionNo === 11} />
            </Dashboard>
            <LockProgressBar className='xLockProgressBar'/>
            <Sidebar visible={sidebarOpened} className='xSidebar' />
       </Body>

       <CircleButton onClick={refreshAccountDetails} className='refresh-button'>
            <SyncIcon fontSize='medium'/>
        </CircleButton>
        <CircleButton onClick={e=>lockUp(true)} className='lock-button'>
            <LockIcon fontSize='medium'/>
        </CircleButton>
    </Wrapper>
}