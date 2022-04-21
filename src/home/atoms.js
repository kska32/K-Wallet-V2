import {atom,selector} from 'recoil';
import C from "../background/constant";

const promiseSendMessage = (msg) => {
    return new Promise((resolve,reject)=>{
        chrome.runtime.sendMessage(msg, (state)=>{
            if(chrome.runtime.lastError){
                reject(chrome.runtime.lastError.message)
            } 
            resolve(state);
        });
    })
}

export const vState = atom({
    key: 'vState',
    default: promiseSendMessage({type: C.MSG_GET_STATE})
}); 


export const vHasAccount = atom({
    key: 'vHasAccount',
    default: promiseSendMessage({type: C.MSG_HAS_ACCOUNT})
});


export const vRecentReqkeysData = atom({
    key: 'vRecentReqkeysData',
    default: promiseSendMessage({type: C.MSG_GET_RECENT_REQKEYS_DATA}),
});


export const MsgidTabidHashState = atom({
    key: 'msgId-tabId-hash',
    default: {
        origin: '',
        messsageId: '', 
        tabId: '', 
        hash: '', 
        dataType: '', 
        dataParam: {}
    }
});


// =========================================

export const tBackButton = atom({
    key: 'back-button',
    default: {disabled: false}
})


//========================== Selector ==============================


export const vStateX = selector({
    key: 'vStateX',
    get: ({get}) => get(vState),
    set: ({get, set}, newValue)=>{
        chrome.runtime.sendMessage({ type: C.MSG_SET_STATE, value: newValue });
        set(vState, {...get(vState), ...newValue}); 
    }
});

const AtomHelper = (keyName, Atom=vStateX)=>({
    key: keyName,
    get: ({get}) => get(Atom)?.[keyName],
    set: ({get,set}, newValue) => {
        set(Atom, {...get(Atom), [keyName]: newValue});
    }
});

export const vLockupX = selector({
    key: 'vLockupX',
    get: ({get}) => !!get(vStateX)?.password,
    set: ({get,set}, newValue) => {
        if(newValue===true){
            chrome.runtime.sendMessage({ type: C.MSG_LOCK_UP });
        }
    }
});

export const vAccAddrX = selector({
    key: 'vAccAddrX',
    get: ({get}) => {
        let accAddr = get(vStateX)?.keypairHex?.publicKey; 
        return !!accAddr ? 'k:'+accAddr : '';
    }
});

export const vRecentReqkeysDataX = selector({
    key: 'vRecentReqkeysDataX',
    get: ({get}) => get(vRecentReqkeysData),
    set: ({get,set}, newValue) => {
        set(vRecentReqkeysData, [...newValue]);
    }
});

export const vNetworkIdX = selector({
    key: "vNetworkIdX",
    get: ({get}) => get(vStateX)?.networkId,
    set: ({get,set}, newValue) => {
        chrome.runtime.sendMessage({
            type: C.MSG_CHANGE_NETWORKID, 
            networkId: newValue
        });
        set(vState, {...get(vState), networkId: newValue});
    }
});


export const vTokenAddressX = selector({
    key: "vTokenAddressX",
    get: ({get}) => get(vStateX)?.tokenAddress,
    set: ({get,set}, newValue) => {
        chrome.runtime.sendMessage({
            type: C.MSG_CHANGE_FUNGIBLE_V2_TOKEN_ADDR, 
            tokenAddress: newValue
        });
        set(vState, {...get(vState), tokenAddress: newValue});
    }
});

const set = (p) => selector(AtomHelper(p));

export const vTokenAddressListX = set('tokenAddressList');

export const vPasswordX = set('password');

export const vPasswordConfirmX = set('passwordConfirm');

export const vPasswordRX = set('passwordR');

export const vKeypairHexX = set('keypairHex');

export const vPageNumX = set('pageNum');

export const vAccountNameX = set('accountName');

export const vAccountDetailsX = set('accountDetails');

export const vAccountDetailsBX = set('accountDetailsB');

export const vIsLoadingX = set('isLoading');

export const vTransferOptX = set('transferOpt');

export const vTransferConfirmOpenedX = set('transferConfirmOpened');

export const vErrorDataX = set('errorData');

export const vInfoDataX = set('infoData');

export const vGlobalErrorDataX = set('globalErrorData');

export const vSidebarOpenedX = set('sidebarOpened');

export const vKeypairListX = set('keypairList');

export const vConfirmDataX = set('confirmData');

export const vSwitchAccountBoxOpenedX = set('switchAccountBoxOpened');

export const vSenderAddrListX = set('senderAddrList');

export const vReceiverAddrListX = set('receiverAddrList');

export const vPrivateKeyPageX = set('privateKeyPage');

export const vDeleteDataX = set('deleteData');

export const vImportPrikeyPageX = set('importPriKeyPage');

export const vChangePasswordPageX = set('changePasswordPage');

export const vKdaPriceX = set('kdausdt');