import React from "react";
import styled from "styled-components";
import produce from "immer";
import {useSetRecoilState} from 'recoil';
import {vInfoDataX} from '../atoms';
import Button from '@material-ui/core/Button';
import C from "../../background/constant";

const Wrapper = styled.div`
    position: fixed;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.75);
    left: 0px;
    top: 0px;
    z-index: 150;
    color: #eee;

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
        position: relative;
        width: 100%;
        padding: 30px 20px;
        border-radius: 5px;
        height: 100%;
        display: flex;
        flex-flow: column nowrap;

        >div{
            position: relative;
            display: flex;
            flex-flow: column wrap;
            justify-content: space-between;
            flex: 1;

            >div{
                word-break: break-all;

                &.tag{
                    font-size: 12px;
                    color: #999;
                }

                &:nth-of-type(2){
                    text-align: right;
                    user-select: text;
                }

                &:nth-of-type(3){
                    text-align: right;
                    color: orange;
                }
            }

            &.from{
                >div:nth-of-type(2){
                }
            }
            &.to{
                >div:nth-of-type(2){
                }
            }

            &.title{
                font-weight: 600;
                font-size: 18px;
                text-align: center;
                margin-bottom: 20px;
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%,-50%) rotate(300deg);
                font-size: 64px;
                color: rgba(0,0,0,0.25);
                pointer-events: none;
            }
            
            &.confirm{
                
            }

            &.cancel{
                margin-top: 30px;
            }


            &.amount{
               
                >div:nth-of-type(2){
                    margin-bottom: 10px;
                }
            }

            &.maxfee{
                margin-bottom: 10px;
            }

            &.pred{

            }

            &.keys{
                margin-bottom: 8px;
                >.content{
                    position: relative;
                    width: 100%;
                    overflow-y: auto;
                    max-height: 100px;

                    &::-webkit-scrollbar {
                        width: 0px;
                    }

                    >div{
                        font-size: 12px;
                        max-width: 100%;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        line-height: 1.2rem;
                        white-space: nowrap;

                        &:before{
                            content: '🔑';
                            position: relative;
                            margin-right: 3px;
                        }
                    }
                }
            }
        }

    }
`;




const TxTransferInfoView = ({details}) => {
    const {
        senderAccountName, senderChainId, 
        receiverAccountName, receiverChainId, amount
    } = details;

    return <>
            <div className='from'>
                <div className='tag'>From: </div>
                <div>{senderAccountName}</div>
                <div>ChainId: {senderChainId}</div>
            </div>
            <div className='to'>
                <div className='tag'>To: </div>
                <div>{receiverAccountName || senderAccountName}</div>
                <div>ChainId: {receiverChainId || senderChainId}</div>
            </div>
            <div className='amount'>
                <div className='tag'>Amount: </div>
                <div>{amount}</div>
            </div>
    </>
}


const TxRotateInfoView = ({details}) => {
    const {
        senderAccountName, senderChainId, keys, pred,
    } = details;

    return <>
            <div className='from'>
                <div className='tag'>Sender: </div>
                <div>{senderAccountName}</div>
                <div>ChainId: {senderChainId}</div>
            </div>
            <div className='pred'>
                <div className='tag'>Pred: </div>
                <div>{pred}</div>
            </div>
            <div className='keys'>
                <div className='tag'>Keys: </div>
                <div className='content'>
                    {keys.map((k,i)=><div key={i} title={k}>{k}</div>)}
                </div>
            </div>
    </>
}


export default function({infoData, visible}){
    const setInfoData = useSetRecoilState(vInfoDataX);
    const details = infoData?.details??{};
    const {tokenAddress, networkId, txType, gasPrice, gasLimit} = details;
    const {reqkey} = infoData;

    return <Wrapper visible={visible} className='tx-info'>
        <div>
        <div className='title'>Transaction</div>
            <div className='networkId'>
                <div className='tag'>NetworkId: </div>
                <div>{networkId||''}</div>
            </div>
            <div className='tokenAddress'>
                <div className='tag'>tokenAddress: </div>
                <div>{tokenAddress||'coin'}</div>
            </div>
            <div className='reqkey'>
                <div className='tag'>Reqkey: </div>
                <div>{reqkey||''}</div>
            </div>

            {txType === C.TX_SAME_TRANSFER && <TxTransferInfoView details={details} />}
            {txType === C.TX_CROSS_TRANSFER && <TxTransferInfoView details={details} />}
            {txType === C.TX_ROTATE && <TxRotateInfoView details={details} />}

            <div className='maxfee'>
                <div className='tag'>MaxTransactionFee:</div>
                <div>{(gasPrice||0) * (gasLimit||0)}</div>
            </div>
            <div style={{flex:1}}></div>
            <div className='cancel'>
                <Button variant="contained" onClick={()=>{ 
                    setInfoData(produce((s)=>{
                        s.opened = false;
                    }));
                }}>Close</Button>
            </div>
        </div>
    </Wrapper>
}
