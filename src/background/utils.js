/* eslint-disable no-undef */
import $browser from "./web.ext.api";
import CryptoJS from "crypto-js";
import nacl from "tweetnacl";
import {Buffer} from "buffer";
import { reqkeysDB, keypairsDB } from "./localdb";
import C from "./constant";
import {pushNoti} from "./notification";
import createTransfer from "./transaction";

const toBin = hexstr => new Uint8Array(Buffer.from(hexstr,'hex'));
const toHex = b => Buffer.from(b).toString('hex');
export const sha512 = (message) => CryptoJS.SHA512(message).toString(CryptoJS.enc.Base64);

export const isNumber = v => v?.constructor?.name === 'Number';
export const isObject = v => v?.constructor?.name === 'Object';
export const isArray = v => v?.constructor?.name === 'Array';
export const isString = v => v?.constructor?.name === 'String';
export const distinct = arr =>[...new Set(arr)];
export const objectify = (arr, key='key') => arr.reduce((a,c,i) => { a[c[key]] = c; return a; }, {});

export const aesEncrypt = (plaintext, key) => {
    let ciphertext = CryptoJS.AES
                    .encrypt(plaintext, key)
                    .toString();
    let hmac = CryptoJS.HmacSHA256(ciphertext, CryptoJS.SHA256(key)).toString();
    let hmacCiphertext = hmac + ciphertext;
    return hmacCiphertext;
}

export const aesDecrypt = (hmacCiphertext, key) => {
    const hmac = hmacCiphertext.slice(0, 64);
    const ciphertext = hmacCiphertext.slice(64);
    const confirmhmac = CryptoJS.HmacSHA256(ciphertext, CryptoJS.SHA256(key)).toString();

    let plaintext;
    if(hmac===confirmhmac){
            plaintext = CryptoJS.AES
                    .decrypt(ciphertext, key)
                    .toString(CryptoJS.enc.Utf8);
    }else{
            plaintext = "%%ERROR_DECRYPT_FAILED%%";
    }
    return plaintext;
}

export const generateRandomKeypair = () => {
    let kps = nacl.sign.keyPair();
    return {
        publicKey: toHex(kps.publicKey),
        secretKey: toHex(kps.secretKey).slice(0,64)
    }
}

export const getPublicKeyFromSecretKey = (secretKey) => {
    let bin = toBin(secretKey);
    let kp = nacl.sign.keyPair.fromSeed(bin);
    return toHex(kp.publicKey);
}

export const boxEncrypt = (text, password) => {
    let msg = new Uint8Array(Buffer.from(text, 'utf8'));
    let key = nacl.hash(new Uint8Array(Buffer.from(password))).slice(16,48);
    let nonce = nacl.randomBytes(nacl.box.nonceLength);
    let box = nacl.secretbox(msg, nonce, key);
    let encMsg = Buffer.from(nonce).toString('hex') + Buffer.from(box).toString('hex');
    return encMsg;
}

export const boxDecrypt = (encMsg, password) => {
    let key = nacl.hash(new Uint8Array(Buffer.from(password))).slice(16,48);
    let nb = new Uint8Array(Buffer.from(encMsg,'hex'));
    let nonce = nb.slice(0,24);
    let box = nb.slice(24);
    let textBuffer = nacl.secretbox.open(box, nonce, key);
    let text = Buffer.from(textBuffer).toString();
    return text;
}


export const StateManager = (()=>{
    return {
        get: (k) => $browser.storage.local.get(k),
        set: (v) => $browser.storage.local.set(v),
        clear: () => $browser.storage.local.clear()
    }
})();



export const getCurrentKeypair = async () => {
    //必须先登录
    const state = await StateManager.get();
    const encPassword = state.password;
    const encSecretKey = state.keypairHex.secretKey;
    const dec = aesDecrypt(encSecretKey, encPassword||'');
    return dec !== "%%ERROR_DECRYPT_FAILED%%" ? ({
        publicKey: state.keypairHex.publicKey,
        secretKey: JSON.parse(dec)[2]
    }) : null;
}


export const getKeypairFromPubkey = async (pubkey) => {
    //먼저 로그인이 필요함.
    const {password} = await StateManager.get('password');
    if(password === undefined) return null;

    const encPassword = password;
    const keypairs = await keypairsDB.getAll();

    let pubkeys = isArray(pubkey) ? pubkey : [pubkey];
    let result = [];
     
    for(const $pubkey of pubkeys){
        const targetIndex = keypairs.findIndex(k => k.key === $pubkey);
        if(targetIndex === -1) continue;
    
        const targetKeypair = keypairs[targetIndex];
        const encSecretKey = targetKeypair.enc;
        const dec = aesDecrypt(encSecretKey, encPassword);

        if(dec !== "%%ERROR_DECRYPT_FAILED%%"){
            result.push({
                publicKey: $pubkey,
                secretKey: JSON.parse(dec)[2]
            })
        }
    }
    return result;
}


export const pubkeysMeetGuard = (pubkeys, guard) => {
    const preds = {
        "keys-all": ($guard) => $guard?.keys?.every(k=>pubkeys.includes(k))??false,
        "keys-any": ($guard) => $guard?.keys?.some(k=>pubkeys.includes(k))??false,
        "keys-2": ($guard, count = 2) => {
            let s = 0;
            for(let i=0; i < ($guard?.keys?.length??0); i++){
                const t = $guard.keys[i];
                if(pubkeys.includes(t)){
                    if(++s >= count) return true;
                }
            }
            return false;
        }
    }
    return preds?.[guard?.pred]?.(guard)??false
}


export const hasMeetGuard = async (guard) => {
    //Example: has keypairs to meet sender's guard...?
    if(guard === null) throw C.WORDS_SENDER_ACCOUNT_DOES_NOT_EXISTS;
    
    const keypairs = await keypairsDB.getAll();
    const pubkeys = keypairs.map(k=>k.key);
    return pubkeysMeetGuard(pubkeys, guard);
}


export const hasRelativeKeypairs = async (publicKeys) => {
    const keypairs = await keypairsDB.getAll();
    const pubkeys = keypairs.map(k=>k.key);
    const a = [...new Set(publicKeys)];
    const b = [...new Set(pubkeys)];
    const c = [...new Set([...a, ...b])];
    return a.length > 0 && b.length > 0 && c.length === b.length;
}


export function createTabCompletely(createOptions,callback){
    $browser.tabs.create(createOptions).then((tab)=>{
        let tidx = setInterval(()=>{
            $browser.tabs.get(tab.id).then((tabx)=>{
                if(tabx.status==='complete'){
                    clearInterval(tidx);
                    if(callback){
                        callback(tab);
                    }
                }
            }).catch((err)=>{
                console.error(err);
            });
        });
    }).catch((err)=>{
        console.error(err);
    });
}

export function findTabAndHighlightByUrl(url){
    return $browser.tabs.query({}).then((tabs)=>{
        let finded = false;
        let tabid = null;

        let tabix = null;
        let windowId = null;

        for(let i=0; i<tabs.length; i++){
                if(tabs[i].url.indexOf(url)>-1){
                        finded = true;
                        tabix = tabs[i].index;
                        tabid = tabs[i].id;
                        windowId = tabs[i].windowId;
                        break;
                }
        }
        if(finded){
            return $browser.tabs.highlight({tabs:tabix, windowId}).then((window)=>{
                return $browser.windows.update(windowId, {
                    drawAttention: true, 
                    focused: true,
                    state: 'maximized'
                }).then(()=>{
                    return [true, tabid];
                });
            });
        }else{
            return [false, null];
        }
    })
}

export function sendMsgToTabs(queryInfo,message,callback){
    $browser.tabs.query(queryInfo).then((tabs)=>{
        tabs.forEach((tab)=>{
            $browser.tabs.sendMessage(tab.id, message).then((res)=>{
                if($browser.runtime.lastError){}
                if(callback) callback(res,tab);
            }).catch((err)=>console.error(err));
        });
    }).catch((err)=>{
        console.error(err);
    });
}

export function normalizeUTF8(str){
    try{
        return decodeURIComponent(escape(str));
    }catch(err){
        return str;
    }
}

export function delay(t=1000, ret=true){
    return new Promise((resolve)=>{
        setTimeout(()=>resolve(ret),t);
    })
}

export function isValidKey(value){
    const vc = value.toLowerCase();
    if(vc.length !== 64) return false;
    return [...vc].every((v,i)=>"0123456789abcdef".includes(v));
}



export async function createTimer(alarmName, when = 0, interval = 3, handler = () => {}){
    await delay(when * 1000);
    if(handler){
        handler(null, alarmName);
        window.setInterval(()=>handler(null, alarmName), interval * 1000);
    }else{
        throw "has no handler!!!";
    }
}

export function createReqLogger(reqKey, param={}, responds = [], success = false, finished = false, lastError = null){
    let ret = {reqKey, param, responds, success, finished, lastError, step: responds.length, tstep: 0};
    ret.tstep = param.txType === C.TX_CROSS_TRANSFER ? 5 : 2;

    const ssm = async (k, v) => {
        //save to db and send msg to popup.

        await reqkeysDB.upsertItem(reqKey, ret);
        $browser.runtime.sendMessage({
            type: C.FMSG_TRANSFER_PROGRESS, key: k, value: v
        }).catch((err)=>{
            //...
        });
        return v;
    }
    
    return {
        set: async (responds)=>{
            ret.responds = responds;
            ret.step = ret.responds.length;

            if(ret.step === ret.tstep){
                ret.finished = true;
                if(ret.responds[ret.step - 1]?.result?.status === 'success'){
                    ret.success = true;
                    pushNoti(
                        ret.reqKey,
                        ret.param
                    );
                }
            }

            if(ret.step <= 1){
                await StateManager.set({
                    isLoading: {opened: false, text: null},
                    transferConfirmOpened: false, pageNum: 11,
                })
            }
            return await ssm(reqKey, ret); 
        },
        err: async (error)=>{
            await StateManager.set({
                isLoading: {opened: false, text: null}
            });
            ret.lastError = error?.message??error; 
            return await ssm(reqKey, ret); 
        }
    }
}

export async function SendErrorMessage(behavior, totalstep, err, param = {}){
    $browser.runtime.sendMessage({
        type: C.FMSG_TRANSFER_PROGRESS, 
        key: null, 
        value: {
            behavior,
            step: 0, tstep: totalstep, param, responds: [], 
            success: false, finished: false, lastError: ErrorDescription(err)
        }
    }).catch((err)=>{
        //...
    });

    function ErrorDescription(err){
        let errkey = '';
        switch(err?.constructor.name){
            case 'Error':
            case 'TypeError': {
                errkey = err.message;
                break;
            }
            case 'Object': {
                errkey = JSON.stringify(err);
                break;
            }
            default: {
                errkey = err;
                break;
            }
        }

        const descs = {
            ['Failed to fetch']: 'No Network Connection',
        }

        return descs[errkey] || errkey;
    }
}


export const onceTabsOnRemovedListener = (targetTab, callback) => {
    const targetTabId = targetTab.id;
    const targetWindowId = targetTab.windowId;

    const onRemoveHandler = (tabId, {windowId}) => {
         if(tabId === targetTabId && windowId === targetWindowId){
            $browser.tabs.onRemoved.removeListener(onRemoveHandler);
            if(callback) callback();
         }
    };
    $browser.tabs.onRemoved.addListener(onRemoveHandler);
}


export const openPopupWindow = ({
    relativeURL,
    sender,
    messageId,
    width, height, left, top,
    onCloseData = '',
    OPEN_POPUP_WINDOW_RESPONSE = C.MSG_OPEN_POPUP_WINDOW_RESPONSE,
    dataType = '',
    dataParam = {}
}) => {

    const generateURL = () => {
        let path = `chrome-extension://${$browser.runtime.id}/${relativeURL}`;
        let search1 = `?tabId=${sender.tab.id}&messageId=${messageId}&origin=${sender.origin}`;
        let search2 = `&dataType=${dataType}&dataParam=${btoa(JSON.stringify(dataParam))}`;
        return path + search1 + search2;
    }

    return $browser.windows.create({
        focused: true,
        url: generateURL(),
        type: 'popup',
        width, height,
        left, top,
        tabId: sender.tab.id
    }).then((popupWindow) => {
        const onRemove = async (windowId)=>{
            if(windowId === popupWindow.id){
                try{
                    await $browser.tabs.sendMessage(
                        sender.tab.id,
                        {
                            type: OPEN_POPUP_WINDOW_RESPONSE,
                            frameId: sender.frameId,
                            messageId,
                            success: false,
                            data: onCloseData
                        }
                    );
                    $browser.windows.onRemoved.removeListener(onRemove);
                    await $browser.windows.remove(windowId);
                }catch(err){
                    //console.log('window-remove:> ', err);
                }
             }
        }

        $browser.windows.onRemoved.addListener(onRemove,{
            windowTypes: ['popup']
        });
    });
}


//
export const dataGeneratorForPopup = async ({state, dataType, dataParam}) => {
    const $data = {signature: null};

    try{
        switch(dataType){
            case 'accountName': {
                $data.accountName = `k:${state.keypairHex.publicKey}`;
                break;
            }
            case 'signature': {
                /*
                    const {
                        pactCode, envData, sender, 
                        publicKey, chainId, 
                        caps, gasPrice, gasLimit, 
                        ttl, networkId 
                    } = dataParam;
                */
                const sha512pwd = state.password;
                const encryptedKeypair = state.keypairHex.secretKey;
                const dec = aesDecrypt(encryptedKeypair, sha512pwd);

                if(dec !== "%%ERROR_DECRYPT_FAILED%%"){
                    const cct = createTransfer({networkId: dataParam?.networkId});

                    const pubk = dataParam.publicKey;
                    if(!isString(pubk) && !isArray(pubk)) throw "Invalid signing publicKey.";

                    const $publicKeys = isArray(pubk) ? pubk : [pubk];
                    const hasMeet = await hasRelativeKeypairs($publicKeys);
                    if(hasMeet !== true) throw C.WORDS_SENDER_HAS_NOT_ENOUGH_KEYPAIR;
                    
                    const specifiedKeypairs = await getKeypairFromPubkey($publicKeys);
                    cct.setKeypairs(specifiedKeypairs);
                    $data.signature = cct.genSignature({...dataParam});
                }else{
                    $data.signature = null;
                }
                break;
            }
        }
    }catch(err){
        $data.error = err?.message??err;
    }

    return $data;
}



export const CheckTypeSigningCmd = (signingCmd, TypeList = {
    pactCode: {type: 'string'},
    envData: {type: 'object'},
    caps: {type: 'array'},
    networkId: {type: 'string'},
    publicKey: {type: ['string','array']},
    sender: {type: 'string'},
    chainId: {type: 'string'},
    ttl: {type: 'number'},
    gasLimit: {type: 'number'},
    gasPrice: {type: 'number'}
}) => {
    const rt = Object.keys(TypeList).reduce((a, k, i)=>{
        const cmdValueType = signingCmd[k].constructor?.name.toLowerCase();
        const types = TypeList[k].type;
        if(signingCmd[k] === undefined){
            a[k] = `[${k}] must be required!`;
        }else if(cmdValueType !== types && !(isArray(types) && types?.includes(cmdValueType))){
                a[k] = `The value ${JSON.stringify(signingCmd[k])} must be a ${JSON.stringify(types)}!`;
        }
        return a;
    }, {});

    return {ok: Object.keys(rt).length === 0, error: rt};
}


export const isValidKAccount = (value)=>{
    const vc = value;
    if(vc.length !== 66) return false;
    if(vc.includes("k:")===false) return false;
    return [...vc.split(':')[1]].every((v,i)=>"0123456789abcdef".includes(v));
};
