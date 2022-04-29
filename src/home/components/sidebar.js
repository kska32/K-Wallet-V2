import React, {useLayoutEffect, useCallback, useRef} from "react";
import {useRecoilState, useRecoilValue, useSetRecoilState} from 'recoil';
import { 
    vSidebarOpenedX, vKeypairListX, vAccAddrX,
    vPrivateKeyPageX, vConfirmDataX, vSwitchAccountBoxOpenedX,
    vDeleteDataX, vImportPrikeyPageX, vChangePasswordPageX
} from "../atoms.js";
import styled from "styled-components";
import {RippleButton, CopiesButton} from "./special-buttons";

import QRCode from 'qrcode.react';
import C from "../../background/constant";
import {produce,original} from "immer";
import PrivateKey from "./get-private-key";
import ImportPrivateKey from "./import-private-key";
import ChangePassword from "./change-password";

import CheckCircleTwoToneIcon from '@material-ui/icons/CheckCircleTwoTone';
import HighlightOffTwoToneIcon from '@material-ui/icons/HighlightOffTwoTone';
import VpnKeyTwoToneIcon from '@material-ui/icons/VpnKeyTwoTone';



const Wrapper = styled.div`
    position: fixed;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.24);
    box-shadow: 0px 0px 0px 10000px rgba(0,0,0,0.24);
    display: flex;
    flex-flow: column wrap;
    z-index: 380;
    color: #eee;
    transition: all 0.36s;
    opacity: 0;
    pointer-events: none;
    transform: translateX(-100%);

    ${
        p=>p.visible===true && `
            opacity: 1;
            pointer-events: initial;
            transform: translateX(0%);
        `
    }


    >div.sidebarWrapper{
        position: relative;
        height: 100%;
        width: 68%;
        max-width: 300px;
        background-color: rgba(0,0,0,0.7);
        box-shadow: 0px 0px 8px 5px rgba(0,0,0,0.36);
        overflow-y: auto;
        overflow-x: hidden;

        display: flex;
        flex-flow: column nowrap;

        &::-webkit-scrollbar {
            width: 0px;
        }

        >div{
            &:nth-of-type(1){
  
                position: relative;
                width: 100%;
                padding: 50px 30px;
                display: flex;
                flex-flow: column nowrap;
                align-items: center;
                justify-content: center;
                margin: auto;

                >.qrcode{
                    margin-bottom: 5px;
                    border-radius: 10px;
                }

                >.accAddr{
                    max-width: 180px;
                    overflow-x: hidden;
                    text-overflow: ellipsis;
                    font-size: 15px;
                    margin: 10px 0px;
                    position: relative;
                    min-height: 30px;
                    padding-top: 5px;
                    margin-bottom: 50px;
                    >div{
                        position: absolute;
                        right: 0px;
                        top: 0px;
                    }
                }
            }
        }
    }

    span.privateKeyBt{
        position: fixed;
        right: 20px;
        bottom: 120px;
        width: 40px;
        height: 40px;
        background-color: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 50%;
        transition: all 0.6s;
        transform: translateX(8000px);
        cursor: pointer;
        box-shadow: 1px 1px 3px 2px rgba(0,0,0,0.24);

        >svg{
            font-size: 24px;
            color: #eee;
            transform: rotate(135deg);
        }

        &:hover{
            >svg{
                color: #333;
            }
            background-color: #eee;
        }

        &.visible{
            transform: translateX(0px);
        }
    }
`;

const MenuBox = styled.div`
    position: relative;
    max-height: ${p=>p.opened===true ? '109px' : '0px'};
    border-radius: 6px;
    margin: 0px 6px;
    overflow-x: hidden;
    overflow-y: auto;

    box-sizing: border-box;
    transition: all 0.3s;

    white-space: nowrap;

    &::-webkit-scrollbar {
        width: 0px;
    }
`;

const MenuboxItemStyle = styled.div`
    position: relative;
    width: 100%;
    padding: 0px 10px;
    height: 33.98px;
    font-size: 13px;
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-start;
    align-items: center;
    border-radius: 16px;
    transition: all 0.18s;
    user-select: none;

    overflow: hidden;

    &:last-of-type{
        border-bottom: none;
        margin-bottom: 10px;
    }

    &:before{
        content: '⭐';
        position: relative;
        left: 0px;
        color: white;
        margin-right: 4px;
        display:none;
    }

    >div.iconButtonGroup{
        position: absolute;
        right: 0px;
        display: flex;
        flex-flow: row nowrap;
        align-items: center;
        background-color: #1b3a4b;
        height: 100%;
        padding: 0px 6px;
        transition: all 0.36s;
        transform: translateX(101%);

        >svg{
            font-size: 24px;
            background-color: transparent;
            border-radius: 50%;
            margin: 0px 2px;
            color: #fff;
            transition: all 0.18s;
            cursor: pointer;

            &:hover{
                color: #ffb703;
            }
            &:active{
                color: red;
            }
        }
    }

    &:hover{
        content: '';
        background-color: rgba(255,255,255,0.3);

        >div.iconButtonGroup{
            transform: translateX(0%);
        }
    }

    &.selected{
        color: cyan;

        >div.iconButtonGroup{
            display: none;
        }
    }

`;


const MenuboxItem = ({children, onSelect, onRemove, className}) => {
    return <MenuboxItemStyle className={className}>
        {children}
        <div className='iconButtonGroup'>
            <CheckCircleTwoToneIcon onClick={onSelect||(()=>{})} />
            <HighlightOffTwoToneIcon onClick={onRemove||(()=>{})} />
        </div>
    </MenuboxItemStyle>
}

export default React.memo(({className, ...props}) => {
    const accountAddr = useRecoilValue(vAccAddrX);
    const [sidebarOpened, setSidebarOpened] = useRecoilState(vSidebarOpenedX);
    const keypairList = useRecoilValue(vKeypairListX);
    const [confirmData, setConfirmData] = useRecoilState(vConfirmDataX);
    const setDeleteData = useSetRecoilState(vDeleteDataX);
    const [menuboxOpened, setMenuboxOpened] = useRecoilState(vSwitchAccountBoxOpenedX);
    const setPrivateKeyPage = useSetRecoilState(vPrivateKeyPageX);
    const setImportPriKeyPage = useSetRecoilState(vImportPrikeyPageX);
    const setChangePasswordPage = useSetRecoilState(vChangePasswordPageX);
    const menuBoxRef = useRef(null);

    useLayoutEffect(()=>{
        if(confirmData.confirmed===true){
            chrome.runtime.sendMessage({type: C.MSG_GENERATE_RANDOM_KEYPAIR});
            setTimeout(()=>{
                menuBoxRef.current.scrollTo({top: 10000000, behavior: 'smooth'});
            }, 120);
        }
    },[confirmData.confirmed]);

    const onSelect = useCallback((v,i)=>{
        if(v.selected !== true){
            chrome.runtime.sendMessage({
                type: C.MSG_CHANGE_SELECTED_ACCOUNT,
                selectedKey: v.publicKey
            });
        }
    }, []);

    const onRemove = useCallback((v,i)=>{
        setDeleteData({
            opened: true,
            publicKey: v.publicKey
        })
    }, []);

    const onPrivateKey = useCallback((accountAddr)=>{
        setPrivateKeyPage(produce((s)=>{
            s.opened = true;
        }))
    }, []);


    return <Wrapper className={className} 
        visible={sidebarOpened} 
        onClick={(e)=>{setSidebarOpened(false);}}
    >
        <div className='sidebarWrapper'>
            <div onClick={(e)=>{e.stopPropagation()}}>
                <QRCode className='qrcode' value={accountAddr} includeMargin size={220} renderAs='svg'/>
                <div className='accAddr'>{accountAddr}<CopiesButton style={{backgroundColor:'#1b3a4b',transform:'scale(1.2)',marginTop:'5px'}} nobg={false} minisize color='white' text={accountAddr}/></div>
                <RippleButton onClick={()=>setMenuboxOpened(s=>!s)}>Switch Account</RippleButton>
                <MenuBox opened={menuboxOpened} ref={menuBoxRef}>
                    {
                        keypairList.map((v,i)=>{
                            const accaddr = 'k:' + v.publicKey.slice(0,6) + ' . . . ' + v.publicKey.slice(-6);
                            return <MenuboxItem key={v.publicKey} 
                                className={v.selected === true ? 'selected' : ''}
                                onSelect={()=>onSelect(v,i)} 
                                onRemove={()=>onRemove(v,i)}
                            ><CopiesButton nobg minisize color='white' text={'k:' + v.publicKey}/>{accaddr}</MenuboxItem>
                        })
                    }
                </MenuBox>
                <RippleButton onClick={()=>{
                    setMenuboxOpened(true);
                    setConfirmData(produce((s)=>{
                        s.opened = true;
                        s.message = 'You will generate another new account,\nDo not forget to copy your privatekey.';
                    }));
                }}>Create Account</RippleButton>
                <RippleButton onClick={()=>{
                    setImportPriKeyPage(produce((s)=>{
                        s.opened = true;
                    }))
                }}>Import Account</RippleButton>

                <RippleButton onClick={()=>{
                    setChangePasswordPage(produce((s)=>{
                        s.opened = true;
                    }))
                }}>Change Password</RippleButton>
            </div>
        </div>
        <span 
            className={'privateKeyBt' + (sidebarOpened ? ' visible' : '')} 
            onClick={(e)=>{e.stopPropagation(); onPrivateKey(accountAddr); }}
        >
            <VpnKeyTwoToneIcon />
        </span>
        <PrivateKey />
        <ImportPrivateKey />
        <ChangePassword />
    </Wrapper>
});