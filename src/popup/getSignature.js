import $browser from "../background/web.ext.api";
import React,{useCallback} from "react";
import {useRecoilValue} from 'recoil';
import {MsgidTabidHashState} from "../home/atoms.js";
import C from "../background/constant";

import {Wrapper} from './getAccountAddr';


const isObject = (t) => t.constructor.name === 'Object';
const isArray = (t) => t.constructor.name === 'Array';


function ArrayShow(arr){

    return arr.map((v,i)=>{
        return <div key={i}>
            {isObject(v) ? ObjectShow(v) : (isArray(v) ? ArrayShow(v) : <div>{v}</div>)}
        </div>
    })
}

function ObjectShow(obj){
    return <div className='rows'>
        {
            Object.keys(obj).map((k,i)=>{
                return <div key={i} className='row'>
                    <span className='key'>{k}</span>
                    <span className='value'>
                        {isObject(obj[k]) ? 
                            ObjectShow(obj[k]) : ( isArray(obj[k]) ? 
                                    ArrayShow(obj[k]) : <div>{obj[k]}</div>
                            )
                        }
                    </span>
                </div>
            })
        }
    </div>
}

export const GetSignature = () => {
    const {
        origin, messageId, tabId, hash, 
        dataType, dataParam
    } = useRecoilValue(MsgidTabidHashState);

    const clickHandle = useCallback(()=>{
        if(!!hash){
            $browser.runtime.sendMessage({
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
            <div className='param'>
                {
                    dataParam !== null && ObjectShow(dataParam)
                }
            </div>
            <div className='buttons'>
                <button onClick={()=>window.close()}>Cancel</button>
                <button onClick={clickHandle}>Allow</button>
            </div>
        </div>
    </Wrapper>
}