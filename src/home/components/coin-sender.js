import React, {useState, useEffect, useLayoutEffect, useCallback, useMemo} from "react";
import styled from "styled-components";
import {produce,original} from "immer";

import { Input, Dropdown } from 'semantic-ui-react';
import Slider from '@material-ui/core/Slider';
import Button from '@material-ui/core/Button';

import {useRecoilState, useRecoilValue, useSetRecoilState} from 'recoil';
import {
    vAccountDetailsX, vTransferOptX, vTransferConfirmOpenedX, 
    vSenderAddrListX, vReceiverAddrListX, vNetworkIdX, vTokenAddressX
} from '../atoms';
import TransferConfirm from "./confirm-transfer";
import {VisibleStyleComp} from "./styled.comp.js";
import C from "../../background/constant";
import {format} from "./component-utils";
import { QrReaderButton } from "./special-buttons";

import HighlightOffRoundedIcon from '@material-ui/icons/HighlightOffRounded';
import {CopiesButton} from "./special-buttons";


const CoinSenderWrapper = styled(VisibleStyleComp)`
    position: relative;
    width: 100%;
    height: 100%;
    left: 0px;
    top: 0px;
   
    background-color: #eee;
    box-sizing: border-box;
    display: flex;
    flex-flow: column nowrap;
    overflow: initial !important;
    z-index: 301 !important;

    div.row-item{
        position: relative;
        display: flex;
        flex-flow: row nowrap;
        padding-bottom: 10px;

        >span{
            position: relative;
            &.receiver-account{

                >.ui.dropdown{
                    input.search{
                        padding-right: 53px !important;
                    }
                    .divider.text{
                        max-width: 146px !important;
                    }

                    div[role=listbox]>div.item{
                        padding-top: 8px !important;
                        padding-bottom: 8px !important;
                        padding-right: 8px !important;

                        >span.text{
                            width: 100%;
                        }
                    }
                }
            }
        }

        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        .ui.dropdown{
            input.search{
                &::placeholder{

                }
            }
            .divider.default.text{
                text-transform: unset !important;
            }

            &.active.selection{

            }
            &.disabled{
                opacity: 1;
                color: #000;
                text-shadow: 0px 0px 1px rgba(0,0,0,0.5);
                background-color: #bcf0da;
                user-select: none;
                border: thin solid transparent;

                >.dropdown.icon{
                    color: gray;
                }
            }

        }

        /* Firefox */
        input[type=number] {
            -moz-appearance: textfield;
        }

        &.group{
            border: 1px solid rgba(34,36,38,.15);
            padding: 8px 15px;
            padding-bottom: 0px;
            border-radius: 5px;
            background-color: rgba(255,255,255,0.75); 
        }

        &.row{
            flex-direction: row;
        }

        &.column{
            flex-direction: column;
        }

        &.br{
            margin-top: 15px;
            border-top: 3px dashed lightgray;
            padding-top: 15px;
        }

        .hint-balance{
            color: green;
            margin-left: 5px;
        }

        &.amount{
            .amount-input-ui{
                >input{
                    padding-right: 50px !important;
                    border-radius: .28571429rem !important;

                    &:not(:focus){
                        border-right-color: rgba(34,36,38,.15) !important;
                    }
                }
                >div.ui.basic.label{
                    border: 0px;
                    padding: 0px;
                    >div{
                        >span{
                            &:nth-of-type(1){
                                /* max button */
                                position: absolute;
                                right: 16px;
                                font-size: 10px;
                                text-transform: capitalize;
                                color: red;
                                border: thin solid red;
                                border-radius: 5px;
                                padding: 3px;
                                top: 50%;
                                transform: translateY(-50%);
                                user-select: none;
                                cursor: pointer;
                                background-color: transparent;
                                transition: all 0.12s;

                                &:hover{
                                    background-color: red;
                                    color: white;
                                }
                            }

                            &.tokenAddress{
                                position: absolute;
                                right: 56px;
                                top: 50%;
                                transform: translateY(-50%);
                                color: rgba(0,0,0,0.2);
                                font-size: 13px;
                                user-select: none;
                                pointer-events: none;
                            }
                        }
                    }
                }
            }
        }

        &.transaction{
            overflow-x: hidden;
        }

        &.fee{
            >span{
                &:nth-of-type(1){
                    color: rgba(0,0,0,0.5);
                    font-size: 13px;
                    margin-left: 5px;
                }
                &:nth-of-type(2){
                    margin-left: initial;
                    padding: 7px 14px;
                    border-radius: 5px;
                    color: white;
                    font-weight: 600;
                    margin-bottom: 0px;
                    user-select: none;
                    background: #eee; 
                    color: #000;
                    margin-top: 3px;
                }
            }
        }

        &.hidden{
            display: none;
        }

        &.text-overflow {
            .ui.dropdown{
               
                >div{
                    &.divider.text{
                        max-width: 168px;
                        text-overflow: ellipsis;
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    &[role=listbox]{

                        >div[role=option]{
                            >span.text{
                                max-width: 168px;
                                text-overflow: ellipsis;
                                overflow: hidden;
                                white-space: nowrap;
                                display: inline-block;
                            }
                            
                        }
                    }
                }
            }
        }


        span.MuiSlider-markLabel{
            font-size: 10px;
            color: rgba(0,0,0,0.3);
        }
        span.MuiSlider-marked{
            &.one{
                margin-bottom: -10px;
            }
        }

        input{
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
        }

        &.flex1{
            flex: 1;

            >input{
                padding-left: 0px;
                padding-right: 0px;
            }
        }

        >span{
            display: flex;
            flex-flow: column nowrap;

            &:nth-of-type(1){
                flex: 1;
            }

            &:nth-of-type(2){
                margin-left: 10px;
            }

            >div{
                &:nth-of-type(1){
                    /* label */
                    color: rgba(0,0,0,0.5);
                    font-size: 13px;
                    margin-left: 5px;
                }
                &:nth-of-type(2){
                    /* dropdown */
                }
            }
        }
    }


`;

const Wrapper = styled.div`
    position: relative;
    width: 100%;
    height: 600px;
    top: 0px;

    padding: 15px 20px;
    display: flex;
    flex-flow: column nowrap;
    justify-content: space-between;

    &::-webkit-scrollbar {
        width: 0px;
    }
`;


const DropdownItem = styled.span`
    position: relative;
    display: inline-flex !important;
    flex-flow: row nowrap;
    justify-content: space-between;
    align-items: center;
    max-width: 100% !important;

    >span{
        position: relative;
        margin-right: 5px;
        max-width: 168px;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
        align-items: center;
        user-select: none;
        transition: all 0.2s;
        
        &.text{
            width: 100%;
            font-size: 13.2px;
        }

        &.remove{
            display: flex;
            justify-content: center;
            align-items: center;
            border-radius: 50%;
            padding: 2px;
            overflow: visible;
            margin-right: 0px;
            opacity: 0.5;

            svg{
                font-size: 16px;
            }
    
            &:hover{
                opacity: 0.8;
            }
            &:active{
                color: red;
            }

            &.disabled{
                pointer-events: none;
                opacity: 0;
            }
        }

        &.copy{
            display: flex;
            justify-content: center;
            align-items: center;
            border-radius: 50%;
            overflow: visible;
            margin-right: 0px;
            opacity: 0.5;

            >div{
                margin-right: 0px;
            }

            &:hover{
                opacity: 0.8;
            }
        }
    }
`;



export default React.memo(function CoinSender({visible}){
    const [transferOpt, setTransferOpt] = useRecoilState(vTransferOptX); 
    const [transferConfirmOpened, setTransferConfirmOpened] = useRecoilState(vTransferConfirmOpenedX);
    const senderAddrList = useRecoilValue(vSenderAddrListX);
    const [receiverAddrList, setReceiverAddrList] = useRecoilState(vReceiverAddrListX);
    const accountDetails = useRecoilValue(vAccountDetailsX);
    const networkId = useRecoilValue(vNetworkIdX);
    const tokenAddress = useRecoilValue(vTokenAddressX);
    const [reAddrLstDropdownOpt, setReAddrLstDropdownOpt] = useState([]);

    const maxBalanceAmount = useMemo(()=>
        accountDetails?.details?.[transferOpt?.senderChainId??0]?.balance??0,
        [transferOpt?.senderChainId??0, accountDetails]
    );

    const maxTransactionFee = useMemo(()=>
        format(transferOpt.gasPrice * transferOpt.gasLimit), 
        [transferOpt.gasPrice, transferOpt.gasLimit]
    );

    const chainIdList = useMemo(()=>Array(20).fill(0).map((v,i)=>({key:i, text:i, value:i})), []);

    const maxAmountToSend = useCallback(()=>{
            return format(Math.max(maxBalanceAmount - maxTransactionFee, C.MIN_AMOUNT));
    },[maxBalanceAmount, maxTransactionFee]);

    const onAddItemHandle = useCallback((value)=>{
        const vu = value.trim();
        if(vu.length === 0) return;

        setTransferOpt(produce((s)=>{
            s.receiverAccountName = vu;
        }));
        setReceiverAddrList(produce((s)=>{
            if(!s.some((v,i)=>v.value===vu)){
                s.push({text: vu, value: vu, key: s.length + 1});
            }
        }));
        chrome.runtime.sendMessage({
            type: C.MSG_UPSERT_A_RECEIVER_ADDR, 
            receiverAccountName: vu
        });
    }, []);

    const transferAllow = useCallback((t)=>{
        if(!reAddrLstDropdownOpt.some((x)=>x.value.includes(t.receiverAccountName))) return false;
        if(t.receiverAccountName.trim().length === 0) return false;
        if(t.senderAccountName === t.receiverAccountName && t.senderChainId === t.receiverChainId) return false;
        if(t.amount <= 0) return false;
        return true;
    }, [reAddrLstDropdownOpt]);

    const minGasPrice = useMemo(()=>networkId.includes('testnet') ? C.MIN_GAS_PRICE : 1e-8, [networkId]);
    const minGasLimit = C.MIN_GAS_LIMIT;

    useLayoutEffect(()=>{
        const receiverAddrListExt = receiverAddrList.map((c)=>{
            const content = (<DropdownItem>
                <span className='text' title={c.text}>{c.text}</span>
                <span className={'remove' + ((!!+c.owner) ? ' disabled' : '')} 
                    onClick={(e)=>{
                        e.stopPropagation();
                        chrome.runtime.sendMessage({
                            type: C.MSG_REMOVE_RECEIVER_ACCOUNT_NAME,
                            accountName: c.text
                        });
                    }}
                >
                    <HighlightOffRoundedIcon />
                </span>
                <span className='copy' onClick={(e)=>{
                    e.stopPropagation();
                }}>
                    <CopiesButton nobg minisize text={c.text}/>
                </span>
            </DropdownItem>)
            return {...c, content};
        });

        setReAddrLstDropdownOpt(receiverAddrListExt);
    }, [receiverAddrList]);


    return <CoinSenderWrapper visible={visible} className='coin-sender'>
            <Wrapper>
                <div className='row-item text-overflow'>
                    <span>
                        <div>Sender Account:</div>
                        <Dropdown placeholder='Sender Account' search selection 
                            options={senderAddrList}
                            value={transferOpt.senderAccountName}
                            disabled={true}
                        />
                    </span>
                    <span>
                        <div>Chain Id:</div>
                        <Dropdown placeholder='ChainId' compact selection
                            options={chainIdList}
                            style={{width: '100px'}}
                            value={transferOpt.senderChainId}
                            onChange={(e,d)=>{
                                setTransferOpt(produce((s)=>{
                                    s.senderChainId = d.value;
                                    let chainBalance = accountDetails?.details?.[d.value]?.balance;
                                    let chainBalanceMax = Math.max(chainBalance - maxTransactionFee, C.MIN_AMOUNT);
                                    s.amount = format(Math.min(original(s).amount, chainBalanceMax))
                                }));
                            }}
                        />
                    </span>
                </div>
                <div className='row-item text-overflow'>
                    <span className='receiver-account'>
                        <div>Receiver Account:</div>
                        <QrReaderButton onChange={onAddItemHandle} />
                        <Dropdown placeholder='Receiver Account' search selection 
                            allowAdditions
                            options={reAddrLstDropdownOpt} 
                            key={transferOpt.receiverAccountName}
                            value={transferOpt.receiverAccountName}
                            onAddItem={(e,{value})=>{
                                onAddItemHandle(value);
                            }}
                            onChange={(e,d)=>{
                                setTransferOpt(produce((s)=>{
                                    s.receiverAccountName = d.value;
                                }));
                            }}
                        />
                    </span>
                    <span>
                        <div>Chain Id:</div>
                        <Dropdown placeholder='ChainId' compact selection 
                            options={chainIdList}
                            style={{width: '100px'}}
                            value={transferOpt.receiverChainId}
                            onChange={(e,d)=>{
                                setTransferOpt(produce((s)=>{
                                    s.receiverChainId = d.value;
                                }))
                            }}
                        />
                    </span>
                </div>
                <div className='row-item amount'>
                    <span>
                        <div>
                            <span>Amount:</span> 
                            <span className='hint-balance'>(Balance: {maxBalanceAmount})</span>
                        </div>
                        <Input 
                            className='amount-input-ui'
                            placeholder='Amount' 
                            label={{ 
                                basic: true, 
                                content: <div>
                                    <span onClick={()=>{
                                        setTransferOpt(produce((s)=>{
                                            s.amount = maxAmountToSend();
                                        }));
                                    }}>Max</span>
                                    <span className='tokenAddress'>{tokenAddress}</span>
                                </div> 
                            }}
                            labelPosition='right'
                            value={transferOpt.amount}
                            type='number'
                            step='1e-6'
                            min='1e-6'
                            max={maxAmountToSend()}
                            onChange={(e,d)=>{
                                setTransferOpt(produce((s)=>{
                                    s.amount = d.value;
                                }))
                            }}
                            onBlur={()=>{
                                setTransferOpt(produce((s)=>{
                                    s.amount = Math.min(original(s).amount, maxAmountToSend());
                                }));
                            }}
                        />
                    </span>
                </div>
                <div className='row-item'>
                    <span>
                        <div>Transaction Settings:</div>
                        <div className='row-item group column transaction'>
                            <div className='row-item'>
                                <span>
                                    <div>Transaction Speed:</div>
                                    <Slider
                                        className='one'
                                        step={10 * minGasPrice}
                                        min={minGasPrice}
                                        max={C.MAX_GAS_PRICE}
                                        value={transferOpt.gasPrice}
                                        onChange={(e,v)=>{ 
                                            setTransferOpt(produce((s)=>{
                                                let o = original(s);
                                                let gp = format(v)
                                                let curMaxAmount = Math.max(maxBalanceAmount - gp * o.gasLimit, C.MIN_AMOUNT);
                                                s.gasPrice = gp;
                                                s.amount = format(Math.min(curMaxAmount, o.amount));
                                            }));
                                        }}
                                        marks={[
                                            { value: 1, label: 'Slow' },
                                            { value: 250, label: '' },
                                            { value: 500, label: 'Normal' },
                                            { value: 750, label: ''},
                                            { value: 1000, label: 'Fast' },
                                        ]}
                                    />
                                </span>
                            </div>
                            <div className='row-item row'>
                                <span style={{flex: 1}}>
                                    <div>Gas Price:</div>
                                    <Input fluid placeholder='Gas Price' 
                                        step={10 * minGasPrice} 
                                        type='number'
                                        min={minGasPrice}
                                        max={C.MAX_GAS_PRICE}
                                        value={transferOpt.gasPrice} 
                                        onChange={(e,d)=>{
                                            setTransferOpt(produce((s)=>{
                                                let o = original(s);
                                                let gp = Number(d.value);
                                                let curMaxAmount = Math.max(maxBalanceAmount - gp * o.gasLimit, C.MIN_AMOUNT);
                                                s.gasPrice = gp;
                                                s.amount = format(Math.min(curMaxAmount, o.amount));
                                            })) 
                                        }}
                                        onBlur={()=>{
                                            setTransferOpt(produce((s)=>{
                                                s.gasPrice = format(Math.max(+transferOpt.gasPrice, minGasPrice));
                                            }))
                                        }}
                                    />
                                </span>
                                <span style={{flex: 1}}>
                                    <div>Gas Limit:</div>
                                    <Input fluid placeholder='Gas Limit' 
                                        type='number' 
                                        step='100'
                                        min={minGasLimit}
                                        value={transferOpt.gasLimit}
                                        onChange={(e,d)=>{
                                            setTransferOpt(produce((s)=>{
                                                let o = original(s);
                                                let gl = Number(d.value);
                                                let curMaxAmount = Math.max(maxBalanceAmount - o.gasPrice * gl, C.MIN_AMOUNT);
                                                s.gasLimit = Math.max(gl, minGasLimit);
                                                s.amount = format(Math.min(curMaxAmount, o.amount));
                                            }))
                                        }}
                                        onBlur={()=>{
                                            setTransferOpt(produce((s)=>{
                                                s.gasLimit = Math.max(+transferOpt.gasLimit, minGasLimit);
                                            }))
                                        }}
                                    />
                                </span>
                            </div>
                            <div className='row-item column fee'>
                                <span>Max Transaction Fee:</span>
                                <span>{maxTransactionFee}</span>
                            </div>
                            <div className='row-item hidden'>
                                <span>
                                    <div>Creation Timestamp:</div>
                                    <Input 
                                        placeholder='' 
                                        defaultValue={Math.floor(Date.now() / 1000)}
                                    />
                                </span>
                            </div>
                            <div className='row-item'>
                                <span>
                                    <div>Request Expires (TTL):</div>
                                    <div className='row-item'>
                                        <span>
                                            <Input 
                                                value={Number(transferOpt.ttl)}
                                                type="number"
                                                step={100}
                                                min={100}
                                                max={86400}
                                                style={{marginLeft:'0px'}}
                                                onChange={(e,d)=>{
                                                    setTransferOpt(produce((s)=>{
                                                        s.ttl = d.value;
                                                    }))
                                                }}
                                            />
                                        </span>
                                    </div>
                                </span>
                            </div>
                        </div>
                    </span>
                </div>
                <div className='row-item'>
                    <span>
                        <div>Comunication:</div>
                        <Button variant="contained" 
                            color="primary"
                            disabled={!transferAllow(transferOpt)}
                            onClick={(e)=>{ setTransferConfirmOpened(true); }
                        }>Transfer</Button>
                    </span>
                </div>
            </Wrapper>
            <TransferConfirm 
                transferOpt={transferOpt} 
                visible={transferConfirmOpened} 
                cancelConfirm={()=>setTransferConfirmOpened(false)}
            />
    </CoinSenderWrapper>
});

