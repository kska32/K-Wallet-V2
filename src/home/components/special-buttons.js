import React, {useState, useCallback, useLayoutEffect, useRef} from "react";
import styled from "styled-components";
import { makeStyles } from '@material-ui/core/styles';
import FilterNoneIcon from '@material-ui/icons/FilterNone';
import IconButton from '@material-ui/core/IconButton';
import DoneOutlineOutlinedIcon from '@material-ui/icons/DoneOutlineOutlined';
import GradeIcon from '@material-ui/icons/Grade';
import {Button, TextField} from '@material-ui/core';

import RotateRightRoundedIcon from '@material-ui/icons/RotateRightRounded';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import WarningIcon from '@material-ui/icons/Warning';
import SyncProblemIcon from '@material-ui/icons/SyncProblem';
import RefreshIcon from '@material-ui/icons/Refresh';

import { BrowserQRCodeReader } from '@zxing/browser';
import qrScanSvg from "../images/qr-scan-icon.svg";
import CircularProgress from '@material-ui/core/CircularProgress';

import HelpOutlineOutlinedIcon from '@material-ui/icons/HelpOutlineOutlined';
import HelpOutlinedIcon from '@material-ui/icons/HelpOutlined';

const $CopiesButton = styled.div`
    position: relative;
    width: 45px;
    height: 45px;
    border-radius: 50%;
    background-color: rgba(0,0,0,0.06);
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;

    ${p=>p.nobg && `
        background:none !important;
        *{
            background:none !important;
            &:hover{
                background:none !important;
            }
        }
    `}

    ${
        p=>p.minisize && `
            width: 20px;
            height: 20px;
            margin-right: 5px;

            >button.MuiIconButton-root.spbutton{
                >span.MuiIconButton-label{
                    svg{
                        font-size: 13.6px;
                    }
                }
            }
        `
    }


    >button.MuiIconButton-root.spbutton{
        position:relative;
        /* padding: 10px; */

        >span.MuiIconButton-label{
            display: flex;
            flex-flow: column nowrap;
            align-items: center;
            justify-content: center;
            svg{
                color: ${p=>p.color || 'black'};
                
                transition: all 0.18s;
                /* font-size: 10px; */

                &:nth-of-type(1){
                    opacity: 1;
                    transform: scale(1) rotateZ(90deg);
                }
                &:nth-of-type(2){
                    position: absolute;
                    opacity: 0;
                    transform: scale(1.5);
                }

                ${p=>p.copied && `
                    &:nth-of-type(1){
                        opacity: 0;
                        transform: scale(1.5)  rotateZ(90deg);
                    }
                    &:nth-of-type(2){
                        position: absolute;
                        opacity: 1;
                        transform: scale(1);
                    }
                `}
            }
        }
    }
`;

export const CopiesButton = ({text='hello,world', color, nobg, minisize, ...props})=>{
    //copy to clipboard 
    const [copied, setCopied] = useState(false);
    const [tid, setTid] = useState(0);

    const copyToClipboard = useCallback(()=>{
        navigator.clipboard.writeText(text).then(()=>{
            setCopied(true);
            const c = () => setCopied(false);
            clearTimeout(tid);
            setTid(setTimeout(c, 2000));
        });
    }, [text,tid])


    return <$CopiesButton copied={copied} onClick={copyToClipboard} 
                style={props.style} color={color} nobg={nobg} minisize={minisize}
            >
            <IconButton className='spbutton'>
                <FilterNoneIcon />
                <DoneOutlineOutlinedIcon />
            </IconButton>
    </$CopiesButton>
}



//*********************** Ripple buttons **********************//

const RippleButtonStyle = styled.button`
    position: relative;
    width: 90%;
    height: 36px;
    background-color: #eee;
    border-radius: 18px;

    background-color: #3b5998;
    color: #fff;
    font-size: 13px;

    display:flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 16px;

    outline: none;
    border: none;
    cursor: pointer;
    transition: all 0.18s;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0px 0px 3px 2px rgba(255,255,255,0.3);

    &:hover{
        background-color: #304d8a;
    }

    &:active{
        color: red;
    }

    >div{
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        user-select: none;
        padding: 10px;
    }

    @keyframes ripple {
        to {
            transform: scale(60) rotate(360deg);
            opacity: 0;
          }
    }

    >.ripple{
        position: absolute; 
        animation: ripple 600ms linear;
        color: rgba(255, 255, 255, 0.5);
        width: 5px;
        height: 5px;
        pointer-events: none;
        z-index: 3;
    }

`;

export const RippleButton = ({children, onClick, ...props})=>{
    const [ripples,setRipple] = useState([]);
    const [x, setX] = useState(null);
    const [y, setY] = useState(null);

    const onRootClick = useCallback((x,y)=>{
        if(x!==null && y!==null){
            setRipple(<GradeIcon 
                className='ripple' 
                key={Date.now()} 
                style={{left:x, top:y, transform: `scale(0) rotate(${Math.round(Math.random()*720)}deg)`}}
            />);
        }
    },[]);

    const onMouseMove = useCallback((e)=>{
        setX(e.nativeEvent.offsetX);
        setY(e.nativeEvent.offsetY);
    },[])

    return <RippleButtonStyle onClick={()=>onRootClick(x,y)} onMouseMove={onMouseMove} {...props}>
        <div onClick={(e)=>{ onClick(e); }}>
            {children}
        </div>
        {ripples}
    </RippleButtonStyle>
}


//* ***********StatusButton************* */

const useStatusButtonStyles = makeStyles((theme) => ({
    'CaNameBt': {
        'width': '260px',
        'height': '37px',
        'backgroundColor': '#04AA6D',
        '&:hover': {
            'backgroundColor': '#04AA6D'
        }
    },
}));
const StatusButtonWrapper = styled.div`
    position: relative;
    margin-bottom: 30px;

    #check-availability{
        &.status0{

        }
        &.status1{
            transition: all 0.3s;
            @keyframes rotate{
                0%{ transform: rotate(0deg); }
                100%{ transform: rotate(360deg); }
            }
            span>svg{
                animation: rotate 600ms linear infinite; 
            }
        }
        &.status2{
            color: #000;
            background-color: #B1E693;
        }
        &.status3{
            background-color: orange;
        }
        &.status4{
            background-color: red;
        }
    }

    span.alert{
        position: absolute;
        text-align: center;
        bottom: -20px;
        font-size: 13px;
        white-space: nowrap;
        width: 100%;

        &.status1{
            color: #B3541E;
            font-weight: bold;
        }
        &.status2{
            color: green;
        }
        &.status3{
            color: orange;
        }
        &.status4{
            color: red;
        }
    }
`;

export const StatusButton = ({
    children,
    disabled=false,
    initStatus=0,
    onChange,
    ...props
}) => { 
    //checkStatus = [ 0 | 1 | 2 | 3 | 4 ];
    //disabled = [ true | false ];
    const classes = useStatusButtonStyles();
    const [checkStatus, setCheckStatus] = useState(initStatus);
    const [disable, setDisable] = useState(disabled);
    const [init,setInit] = useState(true);

    useLayoutEffect(()=>{ setInit(false); },[]);
    useLayoutEffect(()=>{
        if(init===false){
            if(onChange) onChange(checkStatus);

            if(checkStatus === 1){
                setDisable(true);

                setTimeout(()=>{
                    const rCode = 3;
                    setDisable(rCode === 1 || rCode === 2);
                    setCheckStatus(rCode);

                }, 5000);
            }
        }
    }, [checkStatus]);

    return <StatusButtonWrapper >
        <Button variant="contained" size="large" color="primary"
            id='check-availability' 
            endIcon={{
                0: <></>,
                1: <RotateRightRoundedIcon className='spin' />, 
                2: <CheckCircleOutlineIcon className='ok' />,
                3: <WarningIcon className='unavailable' />,
                4: <SyncProblemIcon className='networkerror' />
            }[checkStatus]}
            className={classes.CaNameBt + (' status' + checkStatus)}
            onClick={()=>setCheckStatus(s=>1)}
            disabled={disable}
        >
            {children}
        </Button>
        <span className={'alert' + (' status'+[checkStatus])}>
            {
                {
                    0: "",
                    1: "Your Account is initializing...Wait for Minutes!",
                    2: "Your Account Has Been Created Successfully.",
                    3: "That account is taken. Try Another!",
                    4: "Network error or something, Try Again!"
                }[checkStatus]
            }
        </span>
    </StatusButtonWrapper>
}



/** ************StatusTextField************** **/

const useStatusTextFieldStyles = makeStyles((theme) => ({
    textField: {
        'backgroundColor': '#fff',
        'width': '260px',
        'borderRadius': '5px',
        'marginTop': '0px',
        'marginBottom': '0px !important'
    }
}));

const StatusTextFieldWrapper = styled.div`
    position: relative;
    display: flex;
    margin-bottom: 30px !important;

    input{
        padding-right: 39px;
    }

    @keyframes rotate{
        0%{ transform: rotate(0deg); }
        100%{ transform: rotate(360deg); }
    }
    span.spin{
        position: absolute;
        display: inline-flex;
        right: 0px;
        top: 50%;
        transform: translate(-50%, -50%);
        justify-content: center;
        align-items: center;

        b{
            /* timer */
            display: flex;
            justify-content: center;
            align-items: center;
            line-height: 1em;
            font-size: 13px;
            height: 15px;
            width: 15px;
            position: relative;
            border-radius: 50%;
            color: #000;
            background-color: orange;
            margin-right: 3px;
        }

        svg{
            &.spin{
                color: gray;
                animation: rotate 600ms linear infinite; 
            }
            &.ok{
                color: green;
            }
            &.unavailable{
                color: orange;
            }
            &.networkerror{
                color: red;
            }
        }
    }
    span.alert{
        position: absolute;
        width: 100%;
        text-align: center;
        bottom: -20px;
        font-size: 13px;

        &.status2{
            color: green;
        }
        &.status3{
            color: orange;
        }
        &.status4{
            color: red;
        }
    }
`;

const idleAndAct = 3;
export const StatusTextField = ({
    defaultValue='',
    onChange=()=>{}, 
    onSendMessage=()=>{},
    disabled=false,
    ...props
}) => {
    const classes = useStatusTextFieldStyles();
    const [checkStatus, setCheckStatus] = useState(0);

    const [init, setInit] = useState(true);
    const [value, setValue] = useState('');
    const [tid, setTid] = useState(0);
    const [ttid, setTTid] = useState(0);
    const [disable, setDisable] = useState(false);
    const [timer, setTimer] = useState(idleAndAct);

    useLayoutEffect(()=>{
        if(init===false){
            clearInterval(ttid);
            setTimer(idleAndAct);
            setTTid(setInterval(()=>{
                setTimer(s=>Math.max(s-1,0));
            },1000));
        }
    },[value]);

    useLayoutEffect(()=>{ setInit(false); },[]);
    useLayoutEffect(()=>{
        if(init===false){
            clearTimeout(tid);
            setCheckStatus(0);

            if(value.length > 0){
                setTid(setTimeout(async()=>{
                    setCheckStatus(1);
                    setDisable(true);
                    if(onSendMessage){
                        await onSendMessage(setCheckStatus, value);
                        setDisable(false);
                    }
                }, idleAndAct * 1000 + 200));
            }
        }
    }, [value]);


    return <StatusTextFieldWrapper>
        <TextField
            label="Account Name"
            id="x-input"
            defaultValue={defaultValue}
            className={classes.textField}
            margin="dense"
            variant="outlined"
            size="medium"
            onChange={e=>{setValue(e.target.value); onChange(e);}}
            disabled={disable || disabled}
        />
        <span className='spin'>
            {
                {
                    0: value.length>0 ? <b>{Math.max(timer,0)}</b> : '',//default
                    1: <RotateRightRoundedIcon className='spin' />, //loading
                    2: <CheckCircleOutlineIcon className='ok' />, //ok
                    3: <WarningIcon className='unavailable'/>,// unavailable
                    4: <SyncProblemIcon className='networkerror'/>
                }[checkStatus]
            }
        </span>
        <span className={'alert' + (' status'+[checkStatus])}>
            {
                {
                    0: "",
                    1: "",
                    2: "Good Luck, Account Name is Available.",
                    3: "That account name is taken. Try Another!",
                    4: "Network error or something, Try Again!"
                }[checkStatus]
            }
        </span>
    </StatusTextFieldWrapper>
};



//************** NetDropdown ****************/


const NetDropdownWrapper = styled.div`
        /* testnet */
        position: relative;
        display: flex;
        flex-flow: column nowrap;
        justify-content: flex-start;
        border-radius: 6px;
        box-shadow: 1.6px 1.6px 2px 1px rgba(0,0,0,0.12);
        max-width: 200px;

        /*
        border-bottom-left-radius: 4px;
        border-bottom-right-radius: 4px;
        */
        
        font-size: 13px;
        background-color: rgba(255,255,255,1);
        box-sizing: border-box;
        cursor: pointer;
        border: thin solid #aaa;
        overflow:hidden;
        font-weight: 600;

        ${
            p=>p.disabled===true && `
                background-color: lightgray;
                pointer-events: none;
                transition: all 0.18s;

                span.refresh svg{
                    background-color: rgba(0,0,0,0) !important;
                    color: rgba(255,255,255, 1) !important;
                }
            `
        }
        
        >div{
            display: flex;
            flex-flow: row nowrap;
            position: relative;

            >span{
                text-overflow: ellipsis;
                white-space: nowrap;
                overflow: hidden;
                display: inline;
                align-items: center;
                jutify-content: center;
                user-select: none;
            }
            
            &:last-of-type{
                border-bottom: none;
            }
            
            &:nth-of-type(1){
                padding: 5px 30px 5px 23px;
                align-items: center;
                justify-content: space-between;

                
                span.refresh{
                    height: 100%;
                    right: 0px;
                    position: relative;
                    display: inline-flex;
                    flew-flow: row nowrap;
                    align-items: center;
                    justify-content: center;
                    margin-left: 12px;

                    >svg{

                        font-size: 18px;
                        background-color: rgba(0,0,0,0.0);
                        border-radius: 50%;
                        color: rgba(0,0,0,0.5);
                        padding: 1px;
                        transition: all 0.18s;

                        ${p=>p.isLoading===true && `
                            animation: rotate 480ms linear infinite; 
                        `}
                        
                        &:hover{
                            background-color: rgba(0,0,0,0.39);
                            color: rgba(255,255,255, 1);
                        }
                        @keyframes rotate{
                            0%{ transform: rotate(0deg); }
                            100%{ transform: rotate(360deg); }
                        }
                    }
                }

                &:before{
                    content: '';
                    position: absolute;
                    left: 0px;
                    top: 50%;
                    transform: translateY(-50%) scale(0.32);
                    width: 20px;
                    height: 20px;
                    background-color: red;
                    border-radius: 50%;

                    ${p=>p.dot==true ? 'background-color: red;' : 'background-color: transparent;'}
                }

                &:after{
                    content: '';
                    position: absolute;
                    right: 10px;
                    top: 50%;
                    transform: translateY(-25%);
                    font-weight: 600;
                    border: 4px solid transparent;
                    border-top: 5px solid rgba(0,0,0,0.66);
                    border-radius: 2px;
                }
                
            }
            &:nth-of-type(2){
                /* main-menu */
                position: relative;
                background-color: rgba(0,0,0,0.01);
                display:flex;
                flex-flow: column nowrap;
                width: 100%;
                left: 0px;
          
                overflow: hidden;
                max-height: 0px;
                transition: all 0.3s ease;
                overflow-y: auto;

                
                &::-webkit-scrollbar {
                    
                }
                &::-webkit-scrollbar-track {
                    background: none;
                }


                >div{
                    padding: 5px 30px 5px 23px;;
                    position: relative;

                    display: flex;
                    flex-flow: row nowrap;
                    align-items: center;

                    >span{
                        text-overflow: ellipsis;
                        white-space: nowrap;
                        overflow: hidden;
                        display: inline;
                        align-items: center;
                        jutify-content: center;
                        user-select: none;
                    }

                    &:first-of-type{
        
                    }

                    &:last-of-type{
                        border-bottom: none;
                    }

                    &:hover{
                        background-color: rgba(0,0,0,0.06);
                    }

                    &.selected{
                        background-color: rgba(0,0,0,0.06);
                    }
                }
            }

            
            ${(p)=>p.activate===true && `
                &:nth-of-type(1){

                }
                &:nth-of-type(2){
                    max-height: 200px;
                }
            `}
        }
`;

export const NetDropdown = ({defaultValue, options, onChange, refreshOnClick, ...props}) => {
    const [state, setState] = useState(Math.max(options.findIndex(v=>v.value===defaultValue),0));
    const [opened, setOpened] = useState(false);
    const thisRef = useRef(null);
    const isInit = useRef(false);
    const [isLoading, setLoading] = useState(false);

    useLayoutEffect(()=>{
        const clickHandle = (e)=>{
            if(e.path.includes(thisRef.current) === false){
                setOpened(false);
            }
        }
        document.body.addEventListener('click', clickHandle);

        return ()=>{
            document.body.removeEventListener('click', clickHandle);
        }
    }, [])

    useLayoutEffect(()=>{
        if(isInit.current === true && onChange){
            onChange(options[state]?.value, options[state]);
        }
        isInit.current = true;
    }, [options[state]?.value]);

    const doRefresh = useCallback(async()=>{
        if(refreshOnClick){
            try{
                setLoading(true);
                await refreshOnClick();
                setLoading(false);
            }catch(err){
                setLoading(false);
            }
        }
    },[]);

    return <NetDropdownWrapper activate={opened} ref={thisRef} 
            isLoading={isLoading} style={props.style} disabled={isLoading}
        >
        <div onClick={()=>setOpened(s=>!s)}>
            <span>
                {options[state]?.text}
            </span>
            {refreshOnClick &&
                <span className='refresh' 
                    onClick={(e)=>{
                        e.stopPropagation(); 
                        setOpened(false);
                        doRefresh();
                    }
                }>
                    <RefreshIcon />
                </span>
            }
        </div>
        <div>
            {
                options.map((v,i)=>{
                    return <div key={v.key} className={state===v.key ? 'selected' : ''} 
                                onClick={()=>{setState(v.key); setOpened(false); }}
                                title={v.text}
                            >
                        <span>{v.text}</span>
                    </div>
                })
            }
        </div>
    </NetDropdownWrapper>
}


const ToggleButtonWrapper = styled.div`
    position: relative;
    background-color: #666;
    cursor: pointer;
    font-size: 16px;
    height: 23px;
    border-radius: 12px;
    box-shadow: 0px 0px 3px 2px rgba(255,255,255,0.3) inset;
    filter: initial;

    .hint-group{

        >span{
            user-select: none;
            padding: 4px;
            font-size: 13px;

            &.dark{

            }
            &.light{

            }
        }
    }

    .circle{
        position: absolute;
        height: 27px;
        width: 27px;
        background-color: rgba(255,255,255,1);
        border-radius: 50%;
        left: 50%;
        top: 50%;
        transform: translate(-100%,-50%);
        box-shadow: 0px 0px 3px 2px rgba(255,255,255,0.5);
        transition: all 0.16s;
        
        &.dark{
            transform: translate(0%,-50%); 
        }

        &:hover{
            box-shadow: 0px 0px 5px 3px rgba(255,255,255,0.7);
        }
    
    }
`;

export const ToggleButton = ({value=false, onChange=()=>{}}) => {
    const [isDark, setDark] = useState(value);

    const onClick = useCallback(()=>{
        setDark((s)=>{
            onChange(!s); 
            return !s;
        });
    },[isDark]);

    return <ToggleButtonWrapper className='toggleButton' onClick={onClick}>
        <div className='hint-group'>
            <span className='dark'>🌜</span>
            <span className='light'>🌞</span>
        </div>
        <div className={'circle' + (isDark ? ' dark' : '')} />
    </ToggleButtonWrapper>
};




const QrReaderBtStyle = styled.div`
    position: absolute;
    width: 18px;
    height: 18px;
    z-index: 12;
    display: flex;
    justify-content: center;
    align-items: center;

    bottom: 12px;
    right: 30px;
    cursor: pointer;
    background: transparent url(${qrScanSvg}) no-repeat center;
    background-size: 86%;

    transition: all 0.1s;
    transform: scale(0.9);

`;

const VideoWrapper = styled.span`
    position: absolute;
    width: 252px;
    height: 252px;

    background-color: white;
    left: 100%;
    top: 100%;

    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    border-radius: 0px 30px 30px;
    box-shadow: 2px 2px 7px 5px rgba(0,0,0,0.16);
    border: 12px solid white;
    box-sizing: border-box;
    opacity: 0.8;

    >video{
        position: relative;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    >.cover{
        position: absolute;
        width: 50%;
        height: 50%;
        background: transparent url(${qrScanSvg}) no-repeat center;
        background-size: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        filter: opacity(0.3);
    }

    
    .title{
        font-size: 13px;
        max-width: 200px;
        text-align: center;
        color: rgba(0,0,0,0.6);
        text-transform: uppercase;
        font-weight: bold;
        bottom: 10px;
        position: absolute;
        font-style: italic;
        user-select: none;
    }

    .circularProgress{
        position: absolute;
        color: red;
        z-index: 1;
        pointer-events: none;
        user-select: none;
        width: 50px !important;
        height: 50px !important;

        transition: all 0.3s;
    }

    max-width: 0px;
    max-height: 0px;
    opacity: 0;
    pointer-events: none;
    transition: all 0.3s;

    ${
        p=>p.isVisible && `
            max-width: 252px;
            max-height: 252px;
            opacity: 1;
            pointer-events: initial;
        `
    }

`;


export const QrReaderButton = ({onChange=()=>{}}) => {
    const $video = React.useRef();
    const $this = React.useRef();
    const [codeReader]= useState(new BrowserQRCodeReader());
    const [isVisible, setVisible] = useState(false);
    const [controls, setControls] = useState(null);
    const [receiverName, setReceiverName] = useState(null);
    const [isLoading, setLoading] = useState(false);

    useLayoutEffect(()=>{
        const clickHandle = (e)=>{
            if(e.path.includes($this.current) === false){
                setVisible(false);
            }
        }
        document.body.addEventListener('click', clickHandle);
        return ()=>{
            document.body.removeEventListener('click', clickHandle);
        }
    }, []);

    const onClick = useCallback(()=>{
        if(isVisible === false){
            setLoading(true);
            codeReader.decodeFromConstraints({ 
                audio: false, video: { facingMode: "user" }
            }, $video.current, (result, error, _controls)=>{
                if(_controls){
                    setControls(_controls);
                    setLoading(false);
                }
                if(result !== undefined){
                    setReceiverName(result.text);
                    _controls.stop();
                    setVisible(false);
                }
            });
        }
        setVisible(!isVisible);
    }, [isVisible, controls, receiverName]);


    useLayoutEffect(()=>{
        if(receiverName !== null){
            onChange(receiverName);
            setReceiverName(null);
        }
    }, [receiverName]);


    useLayoutEffect(()=>{
        if(isVisible === false) controls?.stop?.();
    }, [isVisible, controls]);

    return <QrReaderBtStyle ref={$this} onClick={(e)=>onClick(e)} >
        <VideoWrapper className='videoBoxWrapper' 
            isVisible={isVisible} 
            onClick={e=>e.stopPropagation()}
        >
            <video ref={$video} muted />
            <div className='cover' />
            <div className='title' >
                {"Place your QR code in front of your PC's camera."}
            </div>
            <CircularProgress className='circularProgress' style={{opacity: +isLoading}} />
        </VideoWrapper>
    </ QrReaderBtStyle>
}


/************ AutoLockerSetter ************/

const AutoLockerSetterStyle = styled.span`
    position: absolute;
    height: 23px;
    background-color: rgba(255,255,255,0.1);
    border-radius: 11.5px;
    width: 50px;
    right: 80px;
    top: 50%;
    transform: translateY(-50%);
    box-shadow: 0px 0px 3px 2px rgba(255,255,255,0.5) inset;
    transition: all 0.3s;

    &:hover,
    &:focus{
        background-color: rgba(255,255,255,1);
    }


    >input{
        position: absolute;
        outline: none;
        border: none;
        background: none;
        width: 100%;
        height: 100%;
        font-size: 12px;
        padding: 3px 8px;
        text-align: center;
        color: #000;

        display: inline-flex;
        justify-content: center;
        align-items: center;

        &::-webkit-outer-spin-button,
        &::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }

        &::placeholder{
            font-size: 10px;
        }

        /* Firefox */
        &[type=number] {
            -moz-appearance: textfield;
        }

    }
`;

export const AutoLockerSetter = (props) => {


    return <AutoLockerSetterStyle>
        <input type='number' defaultValue={15} min="1" max="180" maxLength="3" />
    </AutoLockerSetterStyle>
}



const LastOneButtonWrapper = styled.div`
    position: relative;

    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;

    cursor: pointer;
    transition: all 0.24s;
    margin-left: 15px;
    transition: all 0.3s;

    svg{
        font-size: 36px;
        color: rgba(255,255,255,0.8);
        text-shadow: 0px 0px 3px rgba(0,0,0,0.5);
        transform: scale(1);
    }

    &:hover{
        svg{
            transform: scale(1.08);
        }
    }
`;


export const LastOneButton = ({onClick, ...props}) => {

    return <LastOneButtonWrapper className='last-one-button' onClick={onClick}>
        <HelpOutlineOutlinedIcon />
    </LastOneButtonWrapper>
}