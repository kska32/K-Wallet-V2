import React from "react";
import {useLayoutEffect, useState} from "react";
import styled from "styled-components";
import circlesSvg from "../images/circles.svg";
import C from "../../background/constant";

const LoadingBoxStyleW = styled.span`
    position: fixed !important;
    z-index: 10000;
    width: 100%;
    height: 100%;
    left: 0px;
    top: 0px;
    pointer-events: none;

`;
const LoadingBoxStyle = styled.span`
    position: relative !important;
    width: 100%;
    height: 100%;
    left: 0px;
    top: 0px;

    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(255,255,255, 0);
    transition: all 0.24s;
    flex-flow: column nowrap;

    &:before{
        content: '';
        position: relative;
        width: 128px;
        height: 128px;
        background: rgba(0,0,0,0) url(${circlesSvg}) no-repeat center;
        background-size: 80%;
        border-radius: 50%;
        filter: drop-shadow(3px 3px 3px rgba(0, 0, 0, .7));
        opacity: 0;
        transition: all 0.24s;
        transform: scale(0.8);
    }

    &:after{
        content: '${p=>p.loadingText || "Loading . . ."}';
        font-size: 22px;
        font-weight: bold;
        opacity: 0;
        margin-top: 30px;
        color: rgba(0, 0, 0, 0.4);
        filter: drop-shadow(3px 3px 3px rgba(0, 0, 0, .7));
        font-style: oblique;
        color: white;
    }

    ${
        (p)=>{
            if(p.isLoading===true){
                return `
                    background-color: rgba(255,255,255, 0.1);
                    pointer-events: initial;

                    &:after,
                    &:before{
                        opacity: 1;
                        transform: scale(1);
                    }
                `;
            }
        }
    }
`;


export const LoadingBox = ({isLoading, loadingText, timestamp}) => {
    const [tid,setTid] = useState(0);

    useLayoutEffect(()=>{
        const fn = ()=>{
            chrome.storage.local.set({
                isLoading:{
                    opened: false, 
                    text: null, 
                    timestamp: null
                }
            });
        }
        if(!!timestamp){
            setTid((t)=>{
                clearTimeout(t);
                return setTimeout(fn, C.LOADING_BOX_TIMEOUT);
            });
        }
        return ()=>setTid(t=>clearTimeout(t));
    },[timestamp])

    return <LoadingBoxStyleW>
        <LoadingBoxStyle isLoading={isLoading} loadingText={loadingText} />
    </LoadingBoxStyleW>
}
