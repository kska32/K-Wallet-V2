import React, {useState, useCallback, useLayoutEffect} from "react";
import styled from "styled-components";
import {useRecoilState, useSetRecoilState} from 'recoil';

import kadenaLogo from "../../icons/k-colen-logo.svg"
import GitHubIcon from '@material-ui/icons/GitHub';
import EmailIcon from '@material-ui/icons/Email';
import ThumbUpIcon from '@material-ui/icons/ThumbUp';
import TelegramIcon from '@material-ui/icons/Telegram';

import {tLastOnePageOpened} from "../atoms";

const Wrapper = styled.section`
    position: fixed ;
    width: 100%;
    height: 100%;
    left: 0px;
    top: 0px;
    background-color: rgba(0,0,0,0.3);

    box-sizing: border-box;
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    justify-content: center;

    z-index: 380;
    opacity: 0;
    pointer-events: none;
    transition: all 0.18s ease;

    ${
        p => p.visible === true && `
            opacity: 1;
            pointer-events: initial;
            transform: scale(1);

            .contentBox{
                top: -36px !important;

                box-shadow: 0px 0px 100px 60px rgba(0,0,0,0.5) !important;
            }
        `
    }

    *{
        position: relative;
        display: flex;
        font-size: 12px;
        line-height: 1em;
    }

    >div.contentBox{
        position: relative;
        background-color: white;

        flex-flow: row nowrap;
        align-items: center;
        justify-content: space-around;
        width: 80%;
        height: 80%;

        max-width: 560px;
        max-height: 320px;
        border-radius: 20px;
        padding: 30px;

        box-shadow: 3px 3px 10px 6px rgba(0,0,0,0.2);
        filter: invert(1);
        top: 0px;
        transition: all 0.18s;

        >div.logo{
            width: 200px;
            height: 200px;
            background: transparent url(${kadenaLogo}) no-repeat center;
            background-size: 100%;
            opacity: 1;
            display: flex;
            flex-flow: column nowrap;
        }
        >div.author{
            flex-flow: column nowrap;
            width: 180px;
            height: 160px;
            color: #666;
            font-weight: 600;
            justify-content: space-between;
            text-align: left;
            word-break: keep-all !important;

            >div{
                width: 100%;
                justify-content: flex-start;

                &:nth-of-type(1){
                    text-transform: uppercase;
                    font-size: 16px;
                    color: #000;
                }
                &:nth-of-type(2){
                    margin-top: 12px;
                }
                &:nth-of-type(3){
                    word-break: break-all;
                    flex-flow: column wrap;
                    margin-top: 10px;
                    max-width: 80%;
                    >span{
                        &:nth-of-type(1){

                        }
                        &:nth-of-type(2){
                            margin-top: 10px;
                            font-weight: normal;
                        }
                    }
                }
                &:nth-of-type(4){
                    margin-top: 8px;

                    svg{
                        font-size: 28px;
                        background-color: white;
                        border-radius: 50%;
                        padding: 5px;
                        cursor: pointer;
                        box-shadow: 0px 0px 3px 2px rgba(0,0,0,0.12);
                    }

                    a{
                        color: #666;
                    }
                }
            }
        }
    }
`


export default function AppInfo({visible, ...props}){
    const setLastOnePageOpened = useSetRecoilState(tLastOnePageOpened);

    return <Wrapper visible={visible} className={props.className} onClick={()=>setLastOnePageOpened(false)}>
        <div className='contentBox' onClick={e=>e.stopPropagation()}>
            <div className='logo'></div>
            <div className='author'>
                <div>K:WALLET - V2.0.0</div>
                <div>
                    The wallet developed for managing kadena tokens and txs in an secure and easiest way.
                </div>
                <div>
                    <span>Donate this project:</span>
                    <span>k:b8559cae02d291fbff2425511b040aaae606bd8e5edf6a2c16fe7529f6ab77f2</span>
                </div>
                <div>
                    <a href="https://chrome.google.com/webstore/detail/bfjdmoniilmnfleebdfpcchhjbmdffil" target='_blank'><ThumbUpIcon/></a>
                    <a href="https://t.me/sparrow32k" target='_blank'><TelegramIcon /></a>
                    <a href="mailto:kska32@gmail.com" target='_blank'><EmailIcon /></a>
                    <a href="https://github.com/kska32/K-Wallet" target='_blank'><GitHubIcon /></a>
                </div>
            </div>
        </div>
    </Wrapper>
}