import React, {useState, useCallback} from "react";
import styled from "styled-components";
import {VisibleStyleComp} from "./styled.comp.js";
import {CopiesButton, RotateMenu} from "./special-buttons";
import SearchIcon from '@material-ui/icons/Search';
import IconButton from '@material-ui/core/IconButton';
import C from "../../background/constant";
import {vAccountDetailsBX, vGetPublickeyListX2} from "../atoms";
import {useRecoilValue} from 'recoil';
import DoubleArrowIcon from '@material-ui/icons/DoubleArrow';
import {pubkeysMeetGuard} from "../../background/utils";
import VpnKeySharpIcon from '@material-ui/icons/VpnKeySharp';

const AccountDetailsWrapper = styled(VisibleStyleComp)`
    position: relative;
    width: 100%;
    height: 100%;
    left: 0px;
    top: 0px;
    display: flex;
    overflow: hidden;

    &::-webkit-scrollbar {
        width: 0px;
    }

    >div{
        position: relative;
        display: table;
        box-sizing: border-box;
        background-color: #fff;
        height: 600px;
        flex: 1;

        >div{
            display: table-row;

            &:nth-of-type(even){
                background-color: rgba(0,0,0,0.036);
            }
            
            &:nth-of-type(1){
                position: sticky;
                top: 0px;
                background-color: #fff;
                z-index: 1;
                color: #000;
                box-shadow: 0px 1px 3px 2px rgba(0,0,0,0.23);
                user-select: none;
                height: 20px;

                >span{
                    padding: 0px 5px;
                    display: table-cell;
                    text-align: center !important;
                    cursor: default !important;
                }

                &:hover{
                    background-color: #fff !important; 
                }
            }
            
            &:hover{
                background-color: rgba(0,0,0,0.1);
            }


            >span{
                position: relative;
                font-size: 13px;
                font-weight: bold;
                padding: 0px 5px;
                display: table-cell;
                text-align: center;
                margin: auto;
                border-right: 1px solid white;
                height: 22px;
                vertical-align: middle;

                &:nth-of-type(1){
                    >svg{
                        position: absolute;
                        font-size: 12px;
                        cursor: pointer;
                        left: 15px;
                        top: 50%;
                        transform: translateY(-50%) rotateZ(90deg);

                        &:hover{
                            color: orange;
                        }
                        &:active{
                            color: red;
                        }
                    }
                }
                &:nth-of-type(2){

                }
                &:nth-of-type(3){
                    cursor: pointer;
                }
                &:nth-of-type(4){
                }
            }

        }
    }
`;

const NoData = styled.div`
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0px;
    background-color: white !important;
    display: flex !important;
    justify-content: center;
    align-items: center;
    flex-flow: column wrap;
    
    font-size: 20px;
    white-space: nowrap;
    color: rgba(0,0,0,0.36);
    font-weight: bold;
    transition: all 0.18s;

    &:hover{
        background-color: white !important;
    }
`;


const SearchBoxWrapper = styled.section`

    position: absolute;
    right: 0px;
    bottom: 10px;
    display: flex;
    flex-flow: row nowrap;
    width: 0%;
    background: none;
    padding: 0px 10px;

    z-index: 3;

    align-items: center;
    justify-content: flex-end;
    transition: all 0.3s;

    &:focus-within{
       .searchInput{
            background-color: rgba(255,255,255,1);
       }
       .foldButton{

       }
        
    }

    .searchInput{
        position: relative;
        background: none;
        box-shadow: 0px 0px 0px 1px rgba(0,0,0,0.24);
        border-radius: 5px;
        margin-right: 10px;
        display: inline-flex;
        height: 36px;
        flex-flow: row nowrap;
        justify-content: flex-start;
        align-items: center;
        overflow: hidden;
        width: 100%;
        opacity: 0;
        transition: all 0.3s;

        >input{
            border: none;
            outline: none;
            background-color: rgba(255,255,255,0.76);
            height: 100%;
            width: 100%;
            padding: 5px 10px;
            font-size: 13px;
            padding-right: 38px;
        }
    }

    .searchButton{
        position: absolute;
        right: 60px;
        margin: auto;

        width: 30px;
        height: 30px;
       
        opacity: 0;
        pointer-events: none;
        transition: all 0.3s; 
        cursor: none;

        svg{
            transition: all 0.3s;
        }

        &:hover{
            background-color: rgba(0,0,0,0.0);
        }
    }

    .foldButton{
        position: relative;
        width: 36px;
        height: 36px;
        background-color: rgba(0,0,0,0.12);
        box-shadow: 0px 0px 3px 2px rgba(255,255,255,0.8) inset;
        transform: rotateY(180deg);
        transition: all 0.3s;

        svg{
            transition: all 0.3s;
        }

        &.zero{
            svg{
                color: black;
            }
        }
        &.one{  
            svg{
                color: yellow;
            }
        }
        &.two{
            transform: rotateY(0deg);
            svg{
                color: white;
            }
        }

        &:hover{
            background-color: rgba(0,0,0,0.16);
        }

    }


    ${
        p=>p.foldOut && `
            width: 100%;

            .searchInput{
                opacity: 1;
            }

            .searchButton{
                opacity: 1;
                pointer-events: initial;
                transition: all 0.3s; 
                cursor: pointer;

            }
        `
    }

`;

const AccountDetailsWrapperB = styled.section`
    &.AccountDetailsWrapperB{
        position: absolute;
        background-color: #f7f0f5;
        z-index: 1;
        width: 100%;
        left: 0px;
        height: 100%;     

        transition: all 0.36s;
        bottom: -100%;
        opacity: 0;

        ${
            p=>p.show && `
                bottom: 0%;
                opacity: 1;
                transition: all 0.36s 0.3s;
            `
        }

        >div{
            position: absolute;
            width: 100%;
            height: 100%;
            display: table;

            >div{
                display: table-row;
                &:nth-of-type(even){
                    background-color: rgba(0,0,0,0.036);
                }
                
                &:nth-of-type(1){
                    position: sticky;
                    top: 0px;
                    background-color: #fff;
                    z-index: 1;
                    color: #000;
                    box-shadow: 0px 1px 3px 2px rgba(0,0,0,0.23);
                    user-select: none;
                    height: 20px;

                    >span{
                        padding: 0px 5px;
                        display: table-cell;
                        text-align: center !important;
                        cursor: default !important;
                    }

                    &:hover{
                        background-color: #fff !important; 
                    }
                }
                
                &:hover{
                    background-color: rgba(0,0,0,0.1);
                }

                >span{
                    position: relative;
                    font-size: 13px;
                    font-weight: bold;
                    padding: 0px 5px;
                    display: table-cell;
                    text-align: center;
                    margin: auto;
                    border-right: 1px solid white;
                    height: 22px;
                    vertical-align: middle;

                    &:nth-of-type(1){
                        >svg{
                            position: absolute;
                            font-size: 12px;
                            cursor: pointer;
                            left: 15px;
                            top: 50%;
                            transform: translateY(-50%) rotateZ(90deg);

                            &:hover{
                                color: orange;
                            }
                            &:active{
                                color: red;
                            }
                        }
                    }
                    &:nth-of-type(2){

                    }
                    &:nth-of-type(3){
                        cursor: pointer;
                    }
                    &:nth-of-type(4){
                    }
                }
            }
        }
    }
`;


export const SearchBox = React.memo(({accountAddr='', visible}) => {
    const [clicked, setClicked] = useState(0);
    const accountDetailsB = useRecoilValue(vAccountDetailsBX);
    const [value, setValue] = useState(accountDetailsB.accountAddr);

    const onEnterHandle = useCallback((accountName)=>{
        chrome.runtime.sendMessage({
            type: C.MSG_GET_ACCOUNT_DETAILS_B, 
            accountId: accountName
        });       
    }, []);

    return <>
        <SearchBoxWrapper className='searchGroup' foldOut={clicked===1}>
            <div className='searchInput' >
                <input type='text' 
                    placeholder="Search Account Name" 
                    value={value}
                    onChange={e=>setValue(e.target.value)}
                    onKeyUp={e=>{if(e.keyCode===13) onEnterHandle(value)}}
                />
            </div>
            <IconButton className='searchButton' onClick={e=>onEnterHandle(value)}>
                <SearchIcon />
            </IconButton>
            <IconButton 
                className={'foldButton ' + ({0:'zero',1:'one',2:'two'}[clicked])} 
                onClick={()=>setClicked(s => (s+1)%3)} 
            >
                <DoubleArrowIcon />
            </IconButton>
        </SearchBoxWrapper>
        <AccountDetailsWrapperB className="AccountDetailsWrapperB" show={clicked>0}>
            <AccountDetailsCore 
                details={accountDetailsB.details} 
                accountAddr={accountAddr} 
            />
        </AccountDetailsWrapperB>
    </>
});

const  AccountDetailsCoreStyle = styled.div`
    .ownwer-key{
        font-size: 15px;
        transform: translateY(2px);
        color: #333;
        cursor: pointer;

        &:hover{
            color: red;
        }
    }
`;

const AccountDetailsCore = React.memo(({details=[], accountAddr=''}) => {
    const [sym] = useState('-');
    const publicKeyList = useRecoilValue(vGetPublickeyListX2);

    const amOwner = useCallback((v)=>{
        return pubkeysMeetGuard(publicKeyList, v?.guard??null);
    },[publicKeyList]);

    const detailsItemEx = useCallback((ix,data)=>{
        let result = {
            ['chain']: null,
            ['keyset']: {
                ['keys']: [], 
                ['pred']: ''
            },
            ['account']: ''
        }

        result.chain = ix;
        result.keyset = data.guard;
        result.account = data.account;
        return JSON.stringify(result);
    }, []);

    return <AccountDetailsCoreStyle>
            <div>
                <span>Chain.No</span>
                <span>Owner</span>
                <span>Predicate</span>
                <span>Balance</span>
            </div>
            {
                details.map((v,i)=>{
                    return <div key={i}>
                        <span>{(v?.guard) && <CopiesButton style={{position:'absolute', left:'10px'}} nobg minisize text={detailsItemEx(i,v)}/> }{String(i).padStart(2,'0')}</span>
                        <span>{amOwner(v) ? <VpnKeySharpIcon className='ownwer-key' /> : sym}</span>
                        <span title={!!v.guard ? JSON.stringify(v?.guard) : ''}>
                            {v?.guard?.keys?.length}
                            {v?.guard?.keys?.length>0 ? ',' : ''}
                            {v?.guard === null ? sym : ((v?.guard?.pred) ? v.guard.pred : '+++++')}
                        </span>
                        <span>{v?.success === 1 ? v.balance : 'TIMEOUT'}</span>
                    </div>
                })
            }
            {
                details.length === 0 && <NoData>No Data</NoData>
            }
     </AccountDetailsCoreStyle>
});

export default React.memo(function AccountDetails({details=[], accountAddr='', visible}){

    return <AccountDetailsWrapper visible={visible} className='account-details'>
        <AccountDetailsCore details={details} accountAddr={accountAddr}/>
        <SearchBox accountAddr={accountAddr}/>
    </AccountDetailsWrapper>
});