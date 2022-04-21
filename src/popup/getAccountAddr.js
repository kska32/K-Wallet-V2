import React,{useMemo, useLayoutEffect, useCallback} from "react";
import {useRecoilState, useRecoilValue, useSetRecoilState} from 'recoil';
import {MsgidTabidHashState, vPasswordX, vHasAccount, vIsLoadingX, vState } from "../home/atoms.js";
import styled from "styled-components";
import C from "../background/constant";

export const Wrapper = styled.div`
    position: fixed;
    width: 100%;
    height: 100%;
    background-color: #000;
    color: #eee;

    display: flex;
    justify-content: flex-start;
    align-items: center;
    flex-flow: column nowrap;
    box-sizing: border-box;
    padding: 50px 10px;

    overflow-y: auto;
    

    &::-webkit-scrollbar {
        width: 0px;
    }

    .data{
        position: relative;
        width: 100%;
        margin: auto;

        display: flex;
        justify-content: flex-start;
        align-items: center;
        flex-flow: column nowrap;
        

        .origin{
            position: relative;
            font-size: 16px;
            margin-bottom: 20px;
            text-align: center;
            color: orange;
        }
        .desc{
            text-align: center;
            font-size: 14px;
            margin-bottom: 20px;
            text-transform: capitalize;
            >div{

                &:nth-of-type(1){
                    margin-bottom: 10px;
                }

                &:nth-of-type(2){
                    font-weight: bold;
                }
            }
        }

        .param{
            position: relative;
            width: 100%;
            display: flex;
            font-size: 12px;
            color: rgba(255,255,255,0.8);
            justify-content: center;
            max-width: 360px;
            text-transform: initial;
        
            .rows{
                border-radius: 4px;
                border: thin solid rgba(255,255,255,0.3);
                position: relative;
                display: inline-flex;
                flex-flow: column nowrap;
                padding: 3px 5px;

                .row{
                    position: relative;
                    display: inline-flex;
                    flex-flow: row nowrap;
                    overflow: hidden;

                    .key{
                        text-transform: capitalize;
                        position: relative;
                        display: inline-flex;
                        white-space: nowrap;
                        &:after{
                            position: relative;
                            content: ':';
                            margin-right: 6px;
                        }
                    }

                    .value{
                        position: relative;
                        word-break: break-all;
                        width: 100%;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        text-align: right;
                    }
                }
            }
        }
        .buttons{
            margin-top: 20px;
            button{
                font-weight: bold;
                padding: 8px;
                background-color: #eee;
                outline: none;
                border-radius: 4px;
                color: #eee;
                min-width: 100px;
                font-size: 13px;
                text-transform: uppercase;
                box-shadow: 0px 0px 3px 2px rgba(255,255,255,0.5);
                border: none;
                cursor: pointer;

                &:hover{
                    opacity: 0.96;
                }
                &:active{
                    color: red;
                }
                    
                &:nth-of-type(1){
                    background-color: #eee;
                    color: #666;
                    margin-right: 8px;
                }

                &:nth-of-type(2){
                    background-color: #21ba45;
                }
            }
        }
    }
`;

export const GetAccountAddr = (props) => {
    const {
        origin, messageId, tabId, hash, 
        dataType, dataParam
    } = useRecoilValue(MsgidTabidHashState);

    const clickHandle = useCallback((e)=>{
        if(!!hash){
            chrome.runtime.sendMessage({
                type: C.MSG_REQ_USERDATA_FROM_WEBPAGE,
                tabId,
                messageId, 
                hash,
                dataType,
                dataParam
            });
        }
    },[tabId, messageId, hash]);

    return <Wrapper>
        <div className='data'>
            <div className='origin'>
                {origin}
            </div>
            <div className='desc'>
                <div>Request access to your account data</div>
                <div>
                    <span>DataType: </span>
                    <span>[{dataType}]</span>
                </div>
            </div>
            <div className='buttons'>
                <button onClick={()=>window.close()}>Cancel</button>
                <button onClick={clickHandle}>Allow</button>
            </div>
        </div>
    </Wrapper>
}