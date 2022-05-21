
import C from "../background/constant";
import {CheckTypeSigningCmd} from '../background/utils';

if(!!chrome?.runtime?.id){
    //ISOLATED WORLD
    window.addEventListener('message', (event)=>{
        if (event.source !== window) return;
        
        if(event.data.type === C.MSG_OPEN_POPUP_WINDOW){
            const {screen} = window;
            const {messageId} = event.data;

            chrome.runtime.sendMessage({
                type: C.MSG_REQ_USERDATA_FROM_WEBPAGE, 
                messageId,
                screen:{
                    height: screen.height,
                    width: screen.width,
                    availHeight: screen.availHeight,
                    availWidth: screen.availWidth
                },
                dataType: event.data.dataType,
                dataParam: event.data.dataParam
            },()=>{
                if(chrome.runtime.lastError){ }
            });
            
            const resHandle = (message,sender,sendResponse)=>{
                if(message.type === C.MSG_OPEN_POPUP_WINDOW_RESPONSE){
                    if(message.messageId === messageId){
                        chrome.runtime.onMessage.removeListener(resHandle);
                        window.postMessage(message);
                        sendResponse(true)
                    }
                }
                return true;
            };

            chrome.runtime.onMessage.addListener(resHandle);
        }
    });
}else{
    //MAIN  WORLD
    const randomUID = () => btoa(
        [performance.now(), Date.now(), 1]
        .map(x => Math.floor(x * Math.random() * 1e6)).join('')
    );

    const get = ({dataType = '', dataParam = null}) => {
        return new Promise((resolve) => {
            const messageId = randomUID();
            window.postMessage({
                type: C.MSG_OPEN_POPUP_WINDOW, 
                messageId,
                dataType,
                dataParam
            });
            const resHandle = (event) => {
                if(event.data.type === C.MSG_OPEN_POPUP_WINDOW_RESPONSE){
                    if(event.data.messageId === messageId){
                        window.removeEventListener('message', resHandle);
                        const rt = {...event.data};
                        delete rt.type;
                        delete rt.frameId;
                        delete rt.messageId;
                        resolve(rt);
                    }
                }
            };
            window.addEventListener('message', resHandle);
        });
    }

    window.kwalletv2 = {
        getAccountName: () => get({dataType:'accountName'}),
        getSignature: (signingCmd) => {
            const rt = CheckTypeSigningCmd(signingCmd);
            return rt.ok ? 
                get({dataType:'signature', dataParam: signingCmd}) : 
                Promise.reject(rt.error);
        }
    }

}