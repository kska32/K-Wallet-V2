/* eslint-disable func-names */
/* eslint-disable no-unused-vars */

import {keypairsDB, reqkeysDB, accountNamesDB, userOptionsDB} from "./localdb";
import C,{BackgroundState} from "./constant";
import restApi from "./rest.api";

import {
    sha512,
    aesEncrypt,  
    aesDecrypt,
    generateRandomKeypair,
    getPublicKeyFromSecretKey,
    createTabCompletely,
    isValidKey,
    StateManager,
    findTabAndHighlightByUrl,
    sendMessageErrHandle,
    openPopupWindow,
    dataGeneratorForPopup,
    onceTabsOnRemovedListener
} from "./utils";


const Transfer = restApi();
const deepCopy = o => JSON.parse(JSON.stringify(o));

chrome.runtime.onInstalled.addListener(async()=>{
    let state = deepCopy(BackgroundState);
    state.networkId = (await userOptionsDB.getItem('networkId'))?.networkId??state.networkId;
    await StateManager.set(state); 
});

const setLoading = async (s = true) => {
    return await StateManager.set({
        isLoading: {
            opened: s, 
            timestamp: Date.now()
        }
    });
}

async function MessageListener(message, sender = null, sendResponse = ()=>{}){
    let {type} = message;
   
    switch(type){
        case C.MSG_GET_STATE: {
            let state = await StateManager.get();
            if(state.networkId === undefined){
               await StateManager.set(BackgroundState);
            }
            return sendResponse(state);
        }
        case C.MSG_SET_STATE: {
            let state = await StateManager.get();
            state = {...state, ...message.value};
            await StateManager.set(state);
            break;
        }
        case C.MSG_SAVE_PASS:{
            await setLoading(true);
            let state = await StateManager.get();
            const {password, keypairHex:{publicKey,secretKey}} = message;
            const {networkId, tokenAddress} = state; 

            if(password && publicKey && secretKey){
                const accaddr = 'k:' + publicKey;
                state.accountDetails = await getAccountDetails(accaddr, networkId, tokenAddress);
                const sha512pwd = sha512(password);
                const enc = aesEncrypt(JSON.stringify([
                    sha512pwd,
                    publicKey,
                    secretKey
                ]), sha512pwd);
        
                state.keypairHex = {};
                state.keypairHex.publicKey = publicKey;
                state.keypairHex.secretKey = enc;
                state.password = sha512pwd;
                state.transferOpt.senderAccountName = accaddr;
                state.keypairList = [{
                    publicKey: publicKey,
                    secretKey: enc,
                    timestamp: Date.now(),
                    selected: true
                }];

                state.senderAddrList = [{ text: accaddr, value: accaddr, key: 1 }];
                state.receiverAddrList = [{ text: accaddr, value: accaddr, key: 1, owner: 1}];

                keypairsDB.setItem(publicKey, {enc, selected: true});
                accountNamesDB.setItem(accaddr, {owner: true, pubkey: publicKey});
                state.isLoading = {opened: false, text: null};
                state.pageNum = 8;
            }else{
                state.isLoading = {opened: false, text: null};
                sendResponse({ success: false, error: "No Passwords" });
            }
            await StateManager.set(state);
            break;
        }
        case C.MSG_VERIFY_PASSWORD: {
            if(message?.value?.password){
                await setLoading(true);
                const responds = await keypairsDB.getAll();
                const selectedAccIndex = responds.findIndex(o=>o.selected===true);
                const res = responds[selectedAccIndex];
                let state = await StateManager.get();

                if(res !== undefined){
                    const sha512pwd = sha512(message?.value?.password??'');
                    const dec = aesDecrypt(res.enc, sha512pwd);
                    if(dec !== "%%ERROR_DECRYPT_FAILED%%"){
                        state.keypairList = responds.map((v,i)=>{
                            return {
                                publicKey: v.key,
                                secretKey: v.enc,
                                timestamp: v.timestamp,
                                selected: v.selected
                            }
                        });
                        const str = JSON.parse(dec);
                        state.password = str[0];
                        state.isDark = await getUserOptions({isDark: false});
                        state.tokenAddress = await getUserOptions({tokenAddress: 'coin'});
                        const {networkId, keypairList, tokenAddress} = state;
                        state.keypairHex = keypairList[selectedAccIndex];
                        const accaddr = 'k:' + keypairList[selectedAccIndex].publicKey;
                        state.transferOpt.senderAccountName = accaddr;
                        state.tokenAddressList = await getUserOptions({[`tokenAddressList+${networkId}`]: ['coin']});
                        state.senderAddrList = await createSenderAddrList();
                        state.receiverAddrList = await createReceiverAddrList();
                        state.accountDetails = await getAccountDetails(accaddr, networkId, tokenAddress);
                        state.isLoading = {opened: false, text: null};

                        state.pageNum = 8;
                        sendResponse({ success: true, password: state.password });
                        
                    }else{
                        state.isLoading = {opened: false, text: null};
                        sendResponse({ success: false, error: 'Incorrect Password' });
                    }
                }
                await StateManager.set(state);
                break;
            }else{
                sendResponse({
                    success: false, 
                    error: 'Empty password.'
                });
            }
            break;
        }
        case C.MSG_HAS_ACCOUNT: {
            await keypairsDB.getAll().then((res)=>{
                sendResponse(res.length>0);
            });
            break;
        }
        case C.MSG_GET_KDA_PRICE:{
            const res = await userOptionsDB.getItem('kda-price');
            return sendResponse(res?.value??0);
        }
        case C.MSG_VALIDATE_CURRENT_PASSWORD: {
            const {currentPassword} = message;
            if(currentPassword && currentPassword.length >= 8){
                let state = await StateManager.get();
                let pass1Hash = sha512(currentPassword);
                let pass2Hash = state.password;
                return sendResponse({matched: pass1Hash === pass2Hash});
            }else{
                return sendResponse({matched: false});
            }
        }
        case C.MSG_CHANGE_PASSWORD: {
            const {currentPassword, newPassword} = message;
            if(currentPassword && newPassword.length >= 8){
                await keypairsDB.getAll().then(async(responds)=>{
                    const selectedAccIndex = responds.findIndex(o=>o.selected===true);

                    const res = responds[selectedAccIndex];
                    if(res !== undefined){
                        const sha512pwd = sha512(currentPassword);
                        let state = await StateManager.get();
                        if(sha512pwd === state.password){
                            await Promise.all(responds.map((kpi, ix)=>{
                                const dec = aesDecrypt(kpi.enc, sha512pwd);
                                const decArr = JSON.parse(dec);
                                const newPassHash = sha512(newPassword);
                                const enc = aesEncrypt(JSON.stringify([
                                    newPassHash,
                                    decArr[1],
                                    decArr[2]
                                ]), newPassHash);
                                if(selectedAccIndex === ix){
                                    state = {...deepCopy(BackgroundState), pageNum: 5, networkId: state.networkId};
                                }
                                keypairsDB.setItem(decArr[1], {enc, selected: selectedAccIndex === ix });
                            }));
                            return StateManager.set(state);
                        }else{
                            return sendResponse({
                                success: false, 
                                error: "Invalid Password."
                            });
                        }
                    }else{
                        return sendResponse({
                            success: false, 
                            error:"Get All keypairDB got some errored."
                        });
                    }
                });
            }else{
                return sendResponse({
                    success: false, 
                    error: 'Invalid Format.' 
                });
            }
            break;
        }
        case C.MSG_INIT_ACCOUNT: {
            const {accountAddr, nullChainIds} = message;
            const state = await StateManager.get();
            await Transfer.initAccountForAnyChains(accountAddr, nullChainIds, state.networkId);
            break;
        }
        case C.MSG_CHANGE_SELECTED_ACCOUNT: {
            await setLoading(true);
            const { selectedKey } = message;
            let selectedAccIndex = null;
            let kps = await keypairsDB.getAll();
            let state = await StateManager.get();
            state.keypairList = kps.map((v,i)=>{
                if(v.key === selectedKey) selectedAccIndex = i;
                return {
                    publicKey: v.key,
                    secretKey: v.enc,
                    timestamp: v.timestamp,
                    selected: v.key === selectedKey
                }
            });

            state.keypairHex = state.keypairList[selectedAccIndex];
            const accaddr = 'k:' + state.keypairList[selectedAccIndex].publicKey;
            state.transferOpt.senderAccountName = accaddr;

            await Promise.all(kps.map((v,i)=>(keypairsDB.upsertItem(v.key, { selected: v.key === selectedKey }))));
            state.accountDetails = await getAccountDetails(accaddr, state.networkId, state.tokenAddress);
            state.senderAddrList = await createSenderAddrList();
            state.receiverAddrList = await createReceiverAddrList();
            state.isLoading = {opened: false, text: null};
            await StateManager.set(state);
            break;
        }
        case C.MSG_REMOVE_ACCOUNT: {
            const { removeKey } = message;
            await keypairsDB.deleteByKey(removeKey);
            await accountNamesDB.deleteByKey('k:' + removeKey);
            let state = {};
            state.senderAddrList = await createSenderAddrList();
            state.receiverAddrList = await createReceiverAddrList();
            state.keypairList = await createKeypairList();
            state.isLoading = {opened: false, text: null};
            state.deleteData = {
                success: null,
                privateKey: '',
                publicKey: '',
                opened: false
            }
            await StateManager.set(state);
            break;
        }
        case C.MSG_REMOVE_RECEIVER_ACCOUNT_NAME: {
            const {accountName} = message;
            const target = await accountNamesDB.getItem(accountName);

            if(target?.owner === false){
                let state = {};
                await accountNamesDB.deleteByKey(accountName);
                state.receiverAddrList = await createReceiverAddrList();
                await StateManager.set(state);
            }
            break;
        }
        case C.MSG_GET_PRIVATE_KEY: {
            const { password } = message;
            const sha512pwd = sha512(password||'');
            let state = await StateManager.get();

            if(sha512pwd === state.password){
                const dec = aesDecrypt(state.keypairHex.secretKey, sha512pwd);
                if(dec !== "%%ERROR_DECRYPT_FAILED%%"){
                    return sendResponse({
                        success: true, 
                        value: JSON.parse(dec).slice(1)
                    });
                }else{
                    return sendResponse({
                        success: false, 
                        error: "Decrypted Failed."
                    });
                }
            }else{
                return sendResponse({
                    success: false, 
                    error: "Invalid Password." 
                });
            }
        }
        case C.MSG_VERIFY_PRIVATE_KEY: {
            const {publicKey, privateKey} = message;
            await setLoading(true);
            await keypairsDB.getItem(publicKey).then(async(res)=>{
                const {key, enc} = res;
                if(key === publicKey) {
                    const state = await StateManager.get();
                    const dec = aesDecrypt(enc, state.password);
                    if(dec !== "%%ERROR_DECRYPT_FAILED%%"){
                        if(privateKey === JSON.parse(dec)[2]){
                            return sendResponse({success: true, error: null});
                        }else{
                            return sendResponse({ success: false, error: "Incorrect Password." });
                        }
                    }
                }else{
                    return sendResponse({ success: false, error: "PublicKey Does Not Match." });
                }
            }).catch((err)=>{
                console.error(err);
                return sendResponse({ success: false, error: "Pubkey Not Founded." })
            }).finally(()=>{
                setLoading(false);
            })
            break;
        }
        case C.MSG_IMPORT_PRIVATE_KEY:{
            const {privateKey} = message;
            
            if(isValidKey(privateKey)){
                await setLoading(true);
                let state = await StateManager.get();
                let publicKey = getPublicKeyFromSecretKey(privateKey);
                const enc = aesEncrypt(JSON.stringify([
                    state.password,
                    publicKey,
                    privateKey
                ]), state.password);

                await keypairsDB.setItem(publicKey, {enc, selected: false});
                await accountNamesDB.setItem('k:' + publicKey, {owner: true, pubkey: publicKey});
                state.senderAddrList = await createSenderAddrList();
                state.receiverAddrList = await createReceiverAddrList();
                state.keypairList = await createKeypairList();
                state.importPriKeyPage.opened = false;
                state.isLoading = {opened: false, text: null};
                await StateManager.set(state);
                break;
            }else{
                return sendResponse({ success: false, error: 'Invalid Private Key.'});
            }
        }
        case C.MSG_LOCK_UP: {
            const cst = [
                'networkId', 'tokenAddress', 'tokenAddressList', 'isDark'
            ];
            const rt = await StateManager.get(cst);
            const resetState = {...deepCopy(BackgroundState), ...rt, pageNum: 5};
            await StateManager.set(resetState);
            break;
        }
        case C.MSG_GET_ACCOUNT_DETAILS: {
            await setLoading(true);
            let state = await StateManager.get();
            let {networkId, tokenAddress} = state;
            state = {};
            state.accountDetails = await getAccountDetails(message.accountId, networkId, tokenAddress);
            state.isLoading = {opened: false, text: null};
            await StateManager.set(state);
            break;
        }
        case C.MSG_GET_ACCOUNT_DETAILS_B: {
            await setLoading(true);
            let state = await StateManager.get();
            let {networkId, tokenAddress} = state;
            state = {};
            state.accountDetailsB = await getAccountDetails(message.accountId, networkId, tokenAddress);
            state.isLoading = {opened: false, text: null};
            await StateManager.set(state);
            break;
        }
        case C.MSG_UPSERT_A_RECEIVER_ADDR: {
            let {receiverAccountName} = message;
            await accountNamesDB.upsertItem(receiverAccountName, {
                pubkey: receiverAccountName.split(':')[1], 
                owner: false
            });
            let state = {};
            state.receiverAddrList = await createReceiverAddrList();
            state.transferOpt.receiverAccountName = receiverAccountName;
            await StateManager.set(state);
            break;
        }
        case C.MSG_GENERATE_RANDOM_KEYPAIR: {
            await setLoading(true);
            let state = await StateManager.get();
            const {publicKey, secretKey} = generateRandomKeypair();
            const sha512pwd = state.password;
            const enc = aesEncrypt(JSON.stringify([sha512pwd,publicKey,secretKey]), sha512pwd);

            await keypairsDB.setItem(publicKey, {enc}),
            await accountNamesDB.setItem('k:' + publicKey, {owner: true, pubkey: publicKey});

            state = {};
            state.keypairList = await createKeypairList();
            state.senderAddrList = await createSenderAddrList();
            state.receiverAddrList = await createReceiverAddrList();
            state.isLoading = {opened: false, text: null};
            state.confirmData = {opened: false, message: null};
            await StateManager.set(state);
            break;
        }
        case C.MSG_JUST_TRANSFER: {
            await setLoading(true);
            const state = await StateManager.get();
            const dec = aesDecrypt(state.keypairHex.secretKey, state?.password??'');

            if(dec !== "%%ERROR_DECRYPT_FAILED%%"){
                let transferOption = {
                    ...message.transferOpt, 
                    networkId: state.networkId,
                    tokenAddress: state.tokenAddress
                };
                await Transfer.justTransfer(transferOption);
                await StateManager.set({isLoading: {opened: false}});
            }else{
                throw 'Incorrect Password.';
            }
            break;
        }
        case C.MSG_CONTINUE_ERROR_TRANSFER: {
            const {reqkey} = message;
            await Transfer.continueErrorTransfer(reqkey);
            return true;
        }
        case C.MSG_GET_RECENT_REQKEYS_DATA: {
            const {limit=5, offset=0} = message;
            const res = await reqkeysDB.getLastMany(limit, offset);
            return sendResponse(res);
        }
        case C.MSG_REMOVE_A_TX_RESULT: {
            const {deleteKey} = message; 
            await reqkeysDB.deleteByKey(deleteKey).then(()=>{
                sendResponse(true);
            }).catch((err)=>{
                console.error(err);
                sendResponse(false);
            });
            return true;
        }
        case C.MSG_GET_NETWORKID: {
            const {networkId} = await StateManager.get('networkId');
            const networkIdValue = await getUserOptions({networkId});
            await StateManager.set({networkId: networkIdValue});
            break;
        }
        case C.MSG_CHANGE_NETWORKID: {
            await setLoading(true);
            const {networkId} = message;
            let state = await StateManager.get();
            state = await setUserOptions({networkId});
            const accountAddr = 'k:' + state.keypairHex.publicKey;
            state.accountDetails = await getAccountDetails(accountAddr, state.networkId, state.tokenAddress);
            state.isLoading = {opened: false, text: null};
            await StateManager.set(state);
            break;
        }
        case C.MSG_GET_AUTOLOCK_PERIOD: {
            const {limitTime} = await StateManager.get('limitTime');//default limitTime
            const rt = await getUserOptions({
                autoLockupTime: { limitTime, endTime: Date.now() + limitTime }
            });
            await StateManager.set({limitTime: rt.limitTime});
            break;
        }
        case C.MSG_SET_AUTOLOCK_PERIOD: {
            const {limitTime} = message;
            const rt = await setUserOptions({
                autoLockupTime: { 
                    limitTime, 
                    endTime: Date.now() + limitTime 
                }
            });
            await StateManager.set({limitTime: rt.limitTime});
            break;
        }
        case C.FMSG_LOCK_PROGRESS_STATE:
        case C.FMSG_TRANSFER_PROGRESS:{
            //转发
            const { type, key, value } = message;
            chrome.runtime.sendMessage({type, key, value}, sendMessageErrHandle);
            break;
        }
        case C.MSG_CHANGE_FUNGIBLE_V2_TOKEN_ADDR: {
            const {tokenAddress} = message;
            await setLoading(true);
            let state = await StateManager.get();
            state = await setUserOptions({tokenAddress});
            const accountAddr = 'k:' + state.keypairHex.publicKey;
            state.accountDetails = await getAccountDetails(accountAddr, state.networkId, state.tokenAddress);
            state.isLoading = {opened: false, text: null};
            await StateManager.set(state);
            break;
        }
        case C.MSG_GET_FUNGIBLE_V2_TOKEN_LIST:{
            let {networkId, tokenAddress} = message;
            const tokenAddressList = await getUserOptions({
                [`tokenAddressList+${networkId}`]: ['coin']
            });
            let rt = {tokenAddressList};
            if(!tokenAddressList.includes(tokenAddress)){
                rt.tokenAddress = 'coin';
            }
            await StateManager.set(rt);
            break;
        }
        case C.MSG_UPDATE_FUNGIBLE_V2_TOKEN_ADDR_LIST:{
            let {networkId} = await StateManager.get('networkId');
            let rt = await Transfer.searchFungibleV2token(networkId);
            await setUserOptions({[`tokenAddressList+${networkId}`]: rt?.fungibleV2??[]});
            return sendResponse(rt);
        }
        case C.MSG_SET_DARK_MODE:{
            const {isDark} = message;
            let state = {};
            state = await setUserOptions({isDark});
            await StateManager.set(state);
            break;
        }
        case C.MSG_CHANGE_ACCOUNT_KEYSET:{
            await setLoading(true);
            const {
                senderAccountName, senderChainId, 
                pred, keys, 
                gasPrice = 1e-8, gasLimit = 600, ttl = 28800
            } = message;
            const {networkId, tokenAddress} = await StateManager.get(['networkId', 'tokenAddress']);
            await Transfer.changeAccountKeyset({
                networkId, tokenAddress, 
                senderAccountName, senderChainId, 
                pred, keys, gasPrice, gasLimit, ttl
            });

            const state = {};
            state.rotateData = {opened: false, pred: "", keys: [], initial: {}};
            state.isLoading = {opened: false, text: null};
            await StateManager.set(state);
            break;
        }
        case C.MSG_REQ_USERDATA_FROM_WEBPAGE:{
            // sender: {
            //    documentId, frameId, id, origin, 
            //    tab:{ id, url, title, windowId, width, heigth, ...}  
            // }
            const {screen, tabId, messageId, hash, dataType, dataParam} = message;
            const state = await StateManager.get();
            const password = state.password;

            const width = 360;
            const height = 600;
            const top = screen ? (screen.height - height) / 2 : 0;
            const left = screen ? (screen.width - width) / 2 : 0;

            if(!!hash){
                const realHash = sha512(JSON.stringify({messageId, password}));//x?
                const windowId = sender.tab.windowId;
                if(hash === realHash){
                    chrome.tabs.sendMessage(
                        tabId,
                        {
                            type: C.MSG_OPEN_POPUP_WINDOW_RESPONSE,
                            frameId: sender.frameId,
                            messageId,
                            success: true,
                            data: await dataGeneratorForPopup({
                                state, dataType, dataParam
                            })
                         }
                    );
                    chrome.windows.remove(windowId);
                }else{
                    //console.log("hash not matched.");
                    //console.log(hash, realHash);
                }
            }else if(!!messageId){
                openPopupWindow({
                    relativeURL: 'popup/index.html',
                    dataType, dataParam,
                    sender, messageId,
                    width, height, left, top,
                    onCloseData: null,
                    OPEN_POPUP_WINDOW_RESPONSE: C.MSG_OPEN_POPUP_WINDOW_RESPONSE
                });
            }else{
                //No messageId,  No hash
                console.error("Invalid Commands.");
            }
            break;
        }
        case C.MSG_CREATE_NEW_TAB: {
            createNewTab();
            break;
        }
        
    }

    return sendResponse(true);
}



function getUserOptions(kvo){
    //kvo => {key:value}
    let key = Object.keys(kvo)[0];
    let defaultValue = kvo[key];
    return userOptionsDB.getItem(key).then((value)=>{
        return value?.[key]??defaultValue;
    }).catch((err)=>{
        console.error(`${key}:> `, err);
        return null;
    })
}

function setUserOptions(kvo){
    let key = Object.keys(kvo)[0];
    let value = kvo[key];

    return StateManager.get().then((state)=>{
        return userOptionsDB.setItem(key, {[key]: value}).then(()=>{
            state[key] = value;
            return state;
        });
    }).catch((err)=>{
        console.error(`${key}:> `, err);
        return false;
    })
}

async function createSenderAddrList(){
    const sas = await keypairsDB.getAll();
    return sas?.map((v,i)=>({
        text: 'k:' + v.key, 
        value: 'k:' + v.key, 
        key: i+1
    })) ?? [];
}

async function createReceiverAddrList(){
    const aas = await accountNamesDB.getAll();
    return aas?.map((v,i)=>({
        text: v.key, 
        value: v.key, 
        key: i + 1,
        owner: "01"[+v.owner]
    })) ?? [];
}

async function createKeypairList(){
    const kps = await keypairsDB.getAll();
    return kps?.map((v)=>({
        publicKey: v.key,
        secretKey: v.enc,
        timestamp: v.timestamp,
        selected: v.selected
    })) ?? [];
}

async function getAccountDetails(accountId, networkId, tokenAddress){
    try{
        const details = await Transfer.getAcctDetailsForAllChains(accountId, networkId, tokenAddress);
        let sum = details.reduce((a,c,i)=>a + Math.max((c?.balance??0),0), 0); 
        let nullChainIds = details.filter(v => v.account === null).map(v => v.chainId);
        let accountDetails = {
            details, sum, nullChainIds,
            accountAddr: accountId, 
            error: null, networkId
        };  
        return accountDetails;
    }catch(err){
        throw err;
    }
}


chrome.runtime.onMessage.addListener(function(msg,sender,sendResponse){
    //console.log("message.type:", msg.type, ", message.content:", msg);
    MessageListener(msg, sender, sendResponse).catch((err)=>{
        //console.error("MessageListener - Error: ", err);
        StateManager.set({isLoading: {opened: false, text: null}});
    })
    return true;
});


chrome.storage.onChanged.addListener((changes)=>{
    let newState = Object.keys(changes).reduce((a,k,i)=>{
        a[k] = changes[k]['newValue'];
        return a;
    }, {});
    chrome.runtime.sendMessage({
        type: C.FMSG_SYNC_BACKGROUND_STATE, 
        ...newState 
    }, sendMessageErrHandle);
});


chrome.action.onClicked.addListener((activeTab)=>{
    createNewTab();
});


chrome.tabs.onUpdated.addListener(function(tabId, changeinfo, tab){
    if(changeinfo.status === 'complete'){
        //ISOLATED-WORLD
        chrome.scripting.registerContentScripts(
            [
                {
                    id: 'k-wallet-scripting-id',
                    js: ['scripting/index.js'],
                    matches: ["<all_urls>"],
                    runAt: "document_start"
                }
            ],
            ()=>{
                if(chrome.runtime.lastError){
                    //Error: Duplicate script ID 'k-wallet-scripting-id'
                }
            }
        );
      
        //MAIN-WORLD
        chrome.scripting.executeScript(
            {
              target: {tabId},
              files: ['scripting/index.js'],
              world: 'MAIN'
            },
            ()=>{
                if(chrome.runtime.lastError){
                    //Error: Duplicate script ID 'k-wallet-scripting-id'
                }
            }
        );
    }
});


const createNewTab = () => {
    const homepath = "home/index.html";
    findTabAndHighlightByUrl(`chrome-extension://${chrome.runtime.id}/${homepath}`, (isExist,thetabid)=>{
        if(!isExist){
            createTabCompletely({url: homepath},(tab)=>{
                //open or highlighted then ...
            });
        }
    });
}




