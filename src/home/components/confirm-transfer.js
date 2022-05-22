import $browser from "../../background/web.ext.api";
import React, {useCallback} from "react";
import styled from "styled-components";
import produce from "immer";
import {useRecoilState, useRecoilValue, useSetRecoilState} from 'recoil';
import {
    vNetworkIdX, vTokenAddressX, vIsLoadingX
} from '../atoms';
import Button from '@material-ui/core/Button';
import C from "../../background/constant";
import {format} from "./component-utils";

const Wrapper = styled.div`
    position: fixed;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.8);
    left: 0px;
    top: 0px;
    color: #eee;
    z-index: 320;

    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center;
    padding: 20px;
    opacity: 0;

    transition: all 0.12s;
    pointer-events: none;
    transform: scale(0.8);

    ${
        (p) => {
            if(p.visible){

                return `
                    opacity: 1;
                    pointer-events: initial;
                    transform: scale(1);
                `
            }
        }
    }

    >div{
        padding: 20px;
        width: 100%;
        border-radius: 5px;

        >div{
            margin: 5px 0px;
            display: flex;
            flex-flow: column wrap;
            justify-content: space-between;

            >div{
                word-break: break-word;

                &.tag{
                    font-size: 12px;
                    color: #999;
                }

                &:nth-of-type(2){
                    text-align: right;

                }

                &:nth-of-type(3){
                    text-align: right;
                }
            }


            &.from{

            }
            &.title{
                font-weigth: 600;
                font-size: 18px;
                text-align: center;
                margin-bottom: 30px;
            }
            
            &.confirm{
                margin-top: 30px;
            }

            &.cancel{
                margin-top: 10px;
            }


            &.amount{
               
                >div:nth-of-type(2){
                    margin-bottom: 10px;
                }
            }
            &.maxfee{
                margin-bottom: 10px;
            }
        }

    }
`;



export default function({transferOpt, visible, cancelConfirm}){
    const networkId = useRecoilValue(vNetworkIdX);
    const tokenAddress = useRecoilValue(vTokenAddressX);
    const setLoading = useSetRecoilState(vIsLoadingX);
    
    const TransferConfirm = useCallback(() => {
        setLoading({opened: true});
        $browser.runtime.sendMessage({
            type: C.MSG_JUST_TRANSFER, 
            transferOpt
        });        
    }, [transferOpt]);


    return <Wrapper visible={visible} className='transfer-confirm'>
        <div>
            <div className='title'>Confirm Transaction</div>
            <div className='networkId'>
                <div className='tag'>NetworkId: </div>
                <div>{networkId}</div>
            </div>
            <div className='tokenAddress'>
                <div className='tag'>TokenAddress: </div>
                <div>{tokenAddress}</div>
            </div>
            <div className='from'>
                <div className='tag'>From: </div>
                <div>{transferOpt?.senderAccountName??''}</div>
                <div>ChainId: {transferOpt?.senderChainId??''}</div>
            </div>
            <div className='to'>
                <div className='tag'>To: </div>
                <div>{transferOpt?.receiverAccountName??''}</div>
                <div>ChainId: {transferOpt?.receiverChainId??''}</div>
            </div>
            <div className='amount'>
                <div className='tag'>Amount: </div>
                <div>{transferOpt?.amount??''}</div>
            </div>
            <div className='maxfee'>
                <div className='tag'>MaxTransactionFee:</div>
                <div>{format((transferOpt?.gasPrice??0) * (transferOpt?.gasLimit??0))}</div>
            </div>
            <div className='confirm'>
                <Button variant="contained" color="primary" onClick={TransferConfirm}>Confirm</Button>
            </div>
            <div className='cancel'>
                <Button variant="contained" color="secondary" onClick={cancelConfirm}>Cancel</Button>
            </div>
        </div>
    </Wrapper>
}
