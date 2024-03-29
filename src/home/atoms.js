import $browser from "../background/web.ext.api";
import {atom,selector} from 'recoil';
import C from "../background/constant";


export const vState = atom({
    key: 'vState',
    default: $browser.runtime.sendMessage({type: C.MSG_GET_STATE})
}); 


export const vHasAccount = atom({
    key: 'vHasAccount',
    default: $browser.runtime.sendMessage({type: C.MSG_HAS_ACCOUNT})
});


export const vRecentReqkeysData = atom({
    key: 'vRecentReqkeysData',
    default: $browser.runtime.sendMessage({type: C.MSG_GET_RECENT_REQKEYS_DATA}),
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
});

export const tLastOnePageOpened = atom({
    key: 'last-one-page',
    default: false
});

export const tLockbarState = atom({
    key: 'lockbar-state',
    default: 100
})


//========================== Selector ==============================

export const vStateX = selector({
    key: 'vStateX',
    get: ({get}) => get(vState),
    set: ({get, set}, newValue)=>{
        $browser.runtime.sendMessage({ type: C.MSG_SET_STATE, value: newValue });
        set(vState, {...get(vState), ...newValue}); 
    }
});

const AtomHelper = (keyName, msgType=null, Atom=vStateX)=>({
    key: keyName,
    get: ({get}) => get(Atom)?.[keyName],
    set: ({get,set}, newValue) => {
        if(!!msgType){
            $browser.runtime.sendMessage({
                type: msgType,
                [keyName]: newValue
            });
        }
        set(Atom, {...get(Atom), [keyName]: newValue});
    }
});

export const vLockupX = selector({
    key: 'vLockupX',
    get: ({get}) => !!get(vStateX)?.password,
    set: ({get,set}, newValue) => {
        if(newValue===true){
            $browser.runtime.sendMessage({ type: C.MSG_LOCK_UP });
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

const set = ($props,$msg,$atom) => selector(AtomHelper($props,$msg,$atom));

export const vNetworkIdX = set(
    'networkId', 
    C.MSG_CHANGE_NETWORKID, 
    vState
);

export const vTokenAddressX = set(
    'tokenAddress', 
    C.MSG_CHANGE_FUNGIBLE_V2_TOKEN_ADDR, 
    vState
);

export const vIsDarkX = set(
    'isDark', 
    C.MSG_SET_DARK_MODE, 
    vStateX
);

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

export const vRotateDataX = set('rotateData');

export const vImportPrikeyPageX = set('importPriKeyPage');

export const vChangePasswordPageX = set('changePasswordPage');

export const vKdaPriceX = set('kdausdt');

export const vGetPublickeyListX2 = selector({
    key: 'getPublicKeyList',
    get: ({get}) => get(vKeypairListX).map(v=>v.publicKey)
});

export const vGetPublickeyListOptionX2 = selector({
    key: 'getPublicKeyListOption',
    get: ({get}) => get(vKeypairListX).map((v)=>({
        key:v.publicKey, text:v.publicKey, value:v.publicKey
    }))
});

export const vGetAppInfo = selector({
    key: 'get-app-information',
    get: ({get}) => $browser.runtime.getManifest()
});
