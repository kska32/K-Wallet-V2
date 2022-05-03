import React,{useState, useCallback, useLayoutEffect, useEffect} from "react";
import styled from "styled-components";
import {useRecoilValue, useRecoilState} from 'recoil';
import produce from "immer";
import Button from '@material-ui/core/Button';
import ErrorOutlineOutlinedIcon from '@material-ui/icons/ErrorOutlineOutlined';
import CloseOutlinedIcon from '@material-ui/icons/CloseOutlined';
import C from "../../background/constant";
import {Icon, Dropdown} from 'semantic-ui-react';
import {isValidKey} from "../../background/utils";
import {RippleButton} from "./special-buttons";

import {
    vGlobalErrorDataX, vConfirmDataX, vDeleteDataX, 
    vRotateDataX, vGetPublickeyListOptionX2
} from "../atoms.js";



const ModalStyle = styled.div`
    position: fixed;
    left: 0px;
    top: 0px;
    width: 100%;
    height: 100%;
    z-index: 380;
    background-color: rgba(0,0,0,0.66);
    display: flex;
    justify-content: center;
    align-items: center;
    color: #fff;
    font-size: 10px;
    opacity: 0;
    pointer-events: none;
    transition: all 0.18s;
    ${
        p=>p.visible==true && `
            opacity: 1;
            pointer-events: initial;
        `
    }
    >div{
        position: relative;
        box-shadow: 6px 8px 5px 3px rgba(0,0,0,0.3);
        &:nth-of-type(1){
            width: 320px;
            height: 150px;
            background-color: #eee;

            display: flex;
            flex-flow: column nowrap;
            justify-content: center;
            align-items: center;
            overflow: hidden;

            >div{
                position: relative;
                width: 100%;
                display: flex;
               
                flex-flow: column nowrap;
                justify-content: center;
                align-item: center;

                &:nth-of-type(1){
                    background-color: #d45659;
                    flex: 1;
                    padding: 0px 15px;
                    font-size: 16px;
                    border-bottom: thin inset rgba(255,255,255,0.3);
                    user-select: none;

                    &.confirmType{
                        background-color: #2a6f97;
                    }

                    &.deleteType{
                        background-color: #333;
                    }
                }
                &:nth-of-type(2){
                    background-color: #d45659;
                    flex: 2;
                    border-bottom: thin inset rgba(255,255,255,0.3);
                    padding: 15px 15px;
                  
                    display: flex;
                    flex-direction: row;
                    overflow: auto;
                    line-height: 1rem;
                    justify-content: center;
                    align-items: flex-start;
                    scroll-padding: 15px;
                    word-break: keep-all;
                    text-align: center;

                    &.confirmType{
                        padding: 15px 70px;
                        text-align: center;
                        word-break: unset;
                        user-select: none;
                        background-color: #2a6f97;
                    }
                    &.deleteType{
                        padding: 15px 70px;
                        text-align: center;
                        word-break: unset;
                        user-select: none;
                        background-color: #333;
                        flex-flow: column nowrap;
                        align-items: center;
                        font-size: 11px;

                        >div.privatekey{
                            position: relative;
                            display: flex;
                            flex-flow: column nowrap;
                            
                            &:before{
                                content: '';
                                background-color: white;
                                width: 100%;
                                position: absolute;
                                display: flex;
                                height: 100%;
                                left: 0px;
                                top: 0px;
                                transition: all 0.24s;
                                transform: scaleX(0);
                                background-color: rgba(255,255,255,0.3);
                                pointer-events: none;
                            }

                            &:focus-within{
                                &:before{
                                    content: '';
                                    transform: scaleX(1);
                                }
                            }

                            &:after{
                                content: 'invalid private key.';
                                position: absolute;
                                font-size: 10px;
                                left: 50%;
                                color: rgba(255,255,255,0.8);
                                transform: translate(-50%,-50%) scale(0.5);
                                top: 100%;
                                white-space: nowrap;
                                margin-top: 10px;
                                transition: all 0.24s;
                                opacity: 0;
                                user-select: none;
                                pointer-events: none;
                            }

                            &.invalid-privatekey{
                                &:after{
                                    transform: translate(-50%,-50%) scale(1);
                                    opacity: 1;
                                }
                            }
                            
                            >input{
                                outline: none;
                                border: none;
                                border-bottom: thin solid white;
                                color: white;
                                font-size: 12px;
                                background-color: transparent;
                                text-align: center;
                                padding: 3px;

                                &::placeholder{
                                    color: rgba(255,255,255,0.5);
                                    font-size: 10px;
                                    text-align: center;
                                    color: #f00;
                                }
                            }
                        }

                    }
                    &::-webkit-scrollbar {
                        width: 3px;
                    }
                }
                &:nth-of-type(3){
                    flex: 1.2;
                    padding: 0px 15px;
                    display: flex;
                    flex-flow: row nowrap;
                    align-items: center;
                    justify-content: flex-end;
                    >button{
                        height: 22px;
                        width: 80px;
                        font-size: 10px;
                        margin-left: 8px;
                    }
                }
            }

            >svg.close-icon{
                position: absolute;
                right: 12px;
                top: 8px;
                color: rgba(255,255,255,0.86);
                cursor: pointer;
                display: flex;
                justify-content: center;
                align-items: center;
                border-radius: 50%;
                user-select: none;
                font-size: 16px;

                &:hover{
                    color: rgba(255,255,255,1);
                }
            }
            >svg.bg-icon{
                position: absolute;
                left: 50%;
                top: 50%;
                font-size: 136px;
                pointer-events: none;
                color: rgba(255,255,0,0.2);
                transform: translate(-50%,-50%);

                &.deleteType{
                    color: rgba(255,255,255,0.1);
                }
            }
        }
    }
`;

export const AlertModal = ()=>{
    const [gErrData,setGErrData] = useRecoilState(vGlobalErrorDataX);

    const close = useCallback(()=>{
        setGErrData(produce((s)=>{
            s.opened = false;
        }))
    },[])

    return <ModalStyle visible={gErrData.opened} onClick={close}>
        <div onClick={e=>e.stopPropagation()}>
            <div>
                <span>Error</span>
            </div>
            <div>
               { gErrData.message }
            </div>
            <div>
                <Button variant="contained" color="secondary" size='small' onClick={close}>ok</Button>
            </div>
            <CloseOutlinedIcon className='close-icon' onClick={close}/>
            <ErrorOutlineOutlinedIcon className='bg-icon'/>
        </div>
    </ModalStyle>
}


export const ConfirmModal = ()=>{
    const [confirmData, setConfirmData] = useRecoilState(vConfirmDataX);

    const close = useCallback(()=>{
        setConfirmData(produce((s)=>{
            s.opened = false;
        }));
    }, []);

    const confirm = useCallback(()=>{
        setConfirmData(produce((s)=>{
            s.opened = false;
            s.message = null;
            s.confirmed = true;
        }));            
    }, []);

    return <ModalStyle visible={confirmData.opened} onClick={close}>
        <div onClick={e=>e.stopPropagation()}>
            <div className='confirmType'>
                <span>Confirm</span>
            </div>
            <div className='confirmType'>
                {confirmData.message}
            </div>
            <div>
                <Button variant="contained" color="secondary" size='small' onClick={close}>cancel</Button>
                <Button variant="contained" color="primary" size='small' onClick={confirm}>confirm</Button>
            </div>
            <CloseOutlinedIcon className='close-icon' onClick={close}/>
            <ErrorOutlineOutlinedIcon className='bg-icon'/>
        </div>
    </ModalStyle>
}


export const DeleteModal = (props) => {
    const [deleteData, setDeleteData] = useRecoilState(vDeleteDataX);
    const [key, setKey] = useState('');
    const [invalidKey, setInvalidKey] = useState(null);
    const [tid, setTid] = useState(0);

    const close = useCallback(()=>{
        setDeleteData(produce((s)=>{
            s.opened = false;
        }));                    
        setKey('');
        setInvalidKey(null);
    }, []);

    const confirm = useCallback(()=>{
        if(key.length >= 64){
            chrome.runtime.sendMessage({
                type: C.MSG_VERIFY_PRIVATE_KEY,
                publicKey: deleteData.publicKey,
                privateKey: key
            }, ({success, error})=>{
                if(success === true){
                    chrome.runtime.sendMessage({
                        type: C.MSG_REMOVE_ACCOUNT,
                        removeKey: deleteData.publicKey
                    });
                    setKey('');
                    setInvalidKey(null);
                }else{
                    setInvalidKey(true);
                }
            });
        }else{
            setInvalidKey(true);
            clearTimeout(tid);
            setTid(setTimeout(()=>{
                setInvalidKey(false);
            }, 2000));
        }
    }, [key, tid, deleteData.publicKey]);


    return <ModalStyle visible={deleteData.opened} onClick={close}>
        <div onClick={e=>e.stopPropagation()}>
            <div className='deleteType'>
                <span>Delete Account?</span>
            </div>
            <div className='deleteType'>
                <div>It will remove the public and private key from this wallet.</div>
                <div className={'privatekey' + (invalidKey === true ? ' invalid-privatekey' : '')}>
                    <input type='password' 
                        placeholder="Enter your private key" 
                        value={key} 
                        onChange={(e)=>{setKey(e.target.value);}}
                    />
                </div>
            </div>
            <div>
                <Button variant="contained" color="secondary" size='small' onClick={close}>cancel</Button>
                <Button variant="contained" color="primary" size='small' onClick={confirm}>confirm</Button>
            </div>
            <CloseOutlinedIcon className='close-icon' onClick={close}/>
            <ErrorOutlineOutlinedIcon className='bg-icon deleteType'/>
        </div>
    </ModalStyle>
}


const RotateModalWrapper = styled.div`
    position: fixed;
    left: 0px;
    top: 0px;
    width: 100%;
    height: 100%;
    z-index: 380;
    background-color: rgba(0,0,0,0.66);
    display: flex;
    justify-content: center;
    align-items: center;
    color: #fff;
    font-size: 13.2px;
    opacity: 0;
    pointer-events: none;
    transition: all 0.18s;


    ${
        p=>p.visible==true && `
            opacity: 1;
            pointer-events: initial;
        `
    }

        >div.core{
            position: relative;
            box-shadow: 6px 8px 5px 3px rgba(0,0,0,0.3);
            width: 600px;
            min-height: 400px;
            background-color: white;
            background-color: #4cc9f0;
            padding: 30px;

            h1{
                margin: 5px 0px 6px;
                text-transform: uppercase;
            }

            .accountChainId{
                font-size: 13.2px;
                margin-bottom: 36px;
                color: rgba(255,255,255,0.6);
                user-select: none;
            }

            .title{
                font-size: 13px;
                color: rgba(255,255,255,0.9);
            }

            .pred-dropdown{
                margin-bottom: 10px;
            }

            .keys-dropdown{
                margin-bottom: 10px;
                >a.ui.label{

                }

                span.v-content{
                    display: inline-flex;
                    font-size: 13.2px;

                    .v-icon{
                        margin-right: 5px;
                    }

                    .v-text{
                        display: inline-block;
                        /*max-width: 200px;*/
                        text-overflow: ellipsis;
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    &.no-private-key{
                        color: red;
                    }
                }
            }

            button.resetOwnership{
                width: 100%;
                border-radius: 4px;
                margin: 38px 0px 10px 0px;
                height: 36px;
                background-color: #ffaa00;
                color: #000;
                font-size: 13px;
                text-transform: uppercase;

                &:hover{
                    background-color: #ffb700;
                }

                &:active{
                    color: red;
                }

            }

            button.changeOwnership{
                width: 100%;
                border-radius: 4px;
                margin: 0px 0px 28px 0px;
                height: 50px;
                background-color: #023e8a;
                font-size: 15px;
                font-weight: bold;
                text-transform: uppercase;

                &:hover{
                    opacity: 0.86;
                }

                &:active{
                    color: red;
                }

            }
        }
`;


export const RotateModal = React.memo(({onSubmit = ()=>{}}) => {
    const [rotateData, setRotateData] = useRecoilState(vRotateDataX);
    const publicKeyListOption = useRecoilValue(vGetPublickeyListOptionX2);
    const [publicKeyListOptionExt, setPublicKeyListOptionExt] = useState([]);
    const [otherPubkeyListOption, setOtherPubkeyListOption] = useState([]);

    const close = useCallback(()=>{
        setRotateData(produce((s)=>{
            s.opened = false;
        }));                    
    }, []);

    const changeAllow = useCallback((d)=>{
        if(d.keys.length === 0) return false;

        const sortedKeysA = JSON.stringify(d.keys.slice().sort((a,b)=>a>b?1:-1));
        const sortedKeysZ = JSON.stringify(d.initial.keys.slice().sort((a,b)=>a>b?1:-1));
        if((sortedKeysA + d.pred) === (sortedKeysZ + d.initial.pred)) return false;

        return true;
    }, []);


    useLayoutEffect(()=>{
        const $arr = [...publicKeyListOption,...otherPubkeyListOption];
        setPublicKeyListOptionExt($arr.map((v,i)=>{
            return {...v, 
                content: <span 
                    key={v.key} 
                    title={v.text} 
                    className={
                        'v-content' + (v.key.includes(C.MARK_HAS_NO_PRIVATEKEY) ? ' no-private-key': '')
                    }
                >
                    <Icon name='key' className='v-icon' />
                    <span className='v-text'>{v.text}</span>
                </span>
            }
        }));
    }, [publicKeyListOption, otherPubkeyListOption]);

    const reset = useCallback((data)=>{
        setRotateData(produce((s)=>{
            s.pred = s.initial.pred;
            s.keys = s.initial.keys;
        }));
    }, []);

    return <RotateModalWrapper visible={rotateData.opened} onClick={close}>
        <div className='core' onClick={e=>e.stopPropagation()}>
            <h1>Change Ownership</h1>
            <div className='accountChainId' title={`${rotateData.account} #${rotateData.chainId}`}>
              - {(rotateData?.account?.slice(0,18)??'') + '... '} #{rotateData.chainId} -
            </div>
            <div className='title'>Predication:</div>
            <Dropdown 
                placeholder='Predicate' 
                selection 
                fluid
                className='pred-dropdown'
                options={['keys-all','keys-any','keys-2'].map((o)=>({key:o, text:o, value:o}))}
                value={rotateData.pred}
                onChange={(e, {value})=>{
                    setRotateData(produce((s)=>{
                        s.pred = value;
                    }));  
                }}
            />
            <div className='title'>Public Keys:</div>
            <Dropdown
                options={publicKeyListOptionExt}
                placeholder='Choose Public Keys'
                search
                selection
                fluid
                className='keys-dropdown'
                multiple
                allowAdditions
                value={rotateData.keys}
                renderLabel={(item) => {
                    return {
                        color: item.key.includes(C.MARK_HAS_NO_PRIVATEKEY) ? 'red' : 'green',
                        content: <span title={item.text}>{`${item.text.slice(0,10)}...`}</span>,
                        icon: 'key',
                    }
                }}
                onAddItem={(e, {value})=>{
                    if(!isValidKey(value)) return;
                    setOtherPubkeyListOption((s)=>([...s, {
                        key:(value + C.MARK_HAS_NO_PRIVATEKEY), text:value, value
                    }]));
                }}
                onChange={(e, {value})=>{
                    setRotateData(produce((s)=>{
                        s.keys = value
                    }));
                }}
            />
            <RippleButton className='resetOwnership' onClick={()=>reset(rotateData)}>Reset</RippleButton>
            <RippleButton 
                className='changeOwnership' 
                disabled={!changeAllow(rotateData)} 
                onClick={()=>onSubmit({
                    senderAccountName: rotateData.account, 
                    senderChainId: rotateData.chainId, 
                    keys: rotateData.keys, 
                    pred: rotateData.pred
                })}
            >
                Change Ownership
            </RippleButton>
        </div>
    </RotateModalWrapper>
});