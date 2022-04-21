import Pact from 'pact-lang-api';
import {delay, getCurrentPrivateKey} from "./utils";


export default function({   
    senderAccountName,
    keypairs,
    receiverAccountName,
    amount,
    senderChainId,
    receiverChainId,
    networkId = 'testnet04',
    gasPrice = 0.000001, 
    gasLimit = 600, 
    xGasPrice = 0.00000001,
    xGasLimit = 400,
    ttl = 28800,
    tokenAddress = 'coin'
}){
    const hostAddrCp = ((networkId="") => {
        networkId = networkId.toLowerCase();
        if(networkId.includes('testnet')){
            return (chainId) => `https://api.testnet.chainweb.com/chainweb/0.0/${networkId}/chain/${chainId}/pact`;
        }else if(networkId.includes('mainnet')){
            return (chainId) => `https://api.chainweb.com/chainweb/0.0/${networkId}/chain/${chainId}/pact`;
        }else{
            throw "The [networkId] is inccorect";
        }
    })(networkId);

    amount = String(amount);
    senderChainId = String(senderChainId);
    receiverChainId = String(receiverChainId);

    gasPrice = Number(gasPrice);
    gasLimit = Number(gasLimit);
    xGasPrice = Number(xGasPrice);
    xGasLimit = Number(xGasLimit);
    ttl = Number(ttl);

    let gasStationAccount = "free-x-chain-gas";

    const creationTime = () => (Math.round(Date.now() / 1000) - 15);
    const getPubKey = (accAddr="") => (accAddr.toLowerCase().includes("k:") ? accAddr.split(":")[1] : accAddr);
    const formatAmount = (amount) => (Math.floor(amount * 1e8) / 1e8).toFixed(8);

    const isNumber = v => v?.constructor?.name === 'Number';
    const isObject = v => v?.constructor?.name === 'Object';
    const isArray = v => v?.constructor?.name === 'Array';
    const isString = v => v?.constructor?.name === 'String';
    const distinct = arr =>[...new Set(arr)];

    const getLocalData = (pactCode, chainId = senderChainId) => {
        return Promise.race([
            Pact.fetch.local({
                pactCode,
                meta: Pact.lang.mkMeta("", String(chainId), gasPrice, gasLimit, ttl, creationTime()),
            }, hostAddrCp(chainId)).then((r)=>(isString(r) ? {result: {status: 'unavailable'}} : r)),
            delay(3000, {result: {status: 'timeout'}})
        ])
    }

    const initAccount = async (
        chainId = senderChainId, 
        accountName = senderAccountName, 
        keys = [keypairs.publicKey], 
        pred = "keys-all"
    )=>{
        const cmds = [
            {
                keyPairs: [],
                pactCode: `(${tokenAddress}.create-account ${JSON.stringify(accountName)} (read-keyset 'account-keyset))`,
                networkId: networkId,
                envData: {
                    "account-keyset": {
                        "keys": keys, 
                        "pred": pred
                    }
                },
                meta: Pact.lang.mkMeta(
                    `${gasStationAccount}`,
                    String(chainId),
                    xGasPrice,
                    xGasLimit,
                    creationTime(),
                    ttl,
                )
            }
        ];
        let res = await Pact.fetch.send(cmds, hostAddrCp(chainId));
        if(res.requestKeys === undefined) throw res;
        return res;
    }

    
    const transferCrosschain = async (guard)=>{
            const cmds = [{
                    pactCode: `(${tokenAddress}.transfer-crosschain ${JSON.stringify(senderAccountName)} ${JSON.stringify(receiverAccountName)} (read-keyset "own-ks") ${JSON.stringify(receiverChainId)} ${formatAmount(amount)})`,
                    networkId: networkId,
                    keyPairs: [{
                        publicKey: keypairs.publicKey,
                        secretKey: keypairs.secretKey,
                        clist: [
                            {
                                name: `${tokenAddress}.DEBIT`,
                                args: [senderAccountName]
                            },
                            {
                                name: `${tokenAddress}.GAS`,
                                args: []
                            }
                        ]
                    }],
                    meta: Pact.lang.mkMeta(senderAccountName, String(senderChainId), gasPrice, gasLimit, creationTime(), ttl),
                    envData: {
                        "own-ks": guard || {
                            "pred": "keys-all",
                            "keys": [ getPubKey(receiverAccountName) ]
                        }
                    }
            }];
    
            let res = await Pact.fetch.send(cmds, hostAddrCp(senderChainId));
            if(res.requestKeys === undefined) throw res;
            return res;
    }


    const transferSamechain = async (guard) => {
        const cmds = [
            {
                pactCode: `(${tokenAddress}.transfer-create ${JSON.stringify(senderAccountName)} ${JSON.stringify(receiverAccountName)} (read-keyset "recp-ks") ${formatAmount(amount)})`,
                networkId: networkId,
                keyPairs: [{
                    publicKey: keypairs.publicKey,
                    secretKey: keypairs.secretKey,
                    clist: [
                        {
                            name: `${tokenAddress}.TRANSFER`,
                            args: [senderAccountName, receiverAccountName, Number(formatAmount(amount))]
                        },
                        {
                            name: `${tokenAddress}.GAS`,
                            args: []
                        }
                    ]
                }],
                meta: Pact.lang.mkMeta(senderAccountName, String(senderChainId), gasPrice, gasLimit, creationTime(), ttl),
                envData: {
                    "recp-ks": guard || {
                        "pred": "keys-all",
                        "keys": [ getPubKey(receiverAccountName) ]
                    }
                }
            }
        ];
        
        let res = await Pact.fetch.send(cmds, hostAddrCp(senderChainId));
        if(res.requestKeys === undefined) throw res;
        return res;
    }


    const selectReqkey = async (reqKey, chainId, step) => { 
        let selectResult = await Pact.fetch.poll({requestKeys: [reqKey]}, hostAddrCp(chainId));
        if(Object.keys(selectResult).length !== 0){
            const reqkeyResult = selectResult[reqKey];
            if(reqkeyResult?.result?.status === 'failure'){
                throw reqkeyResult.result.error.message;
            }else{
                const rt = selectResult[reqKey];
                return rt !== undefined ? rt : null;
            }
        }else{
            return null;

        }
    }

    const createSpvCmd = (reqkeyResult) => {
        if (reqkeyResult?.result?.status === 'success') {
            const pactId = reqkeyResult.continuation.pactId;
            const targetChainId = reqkeyResult.continuation.yield.provenance.targetChainId;
            const sourceChainId = reqkeyResult.continuation.yield.source;

            const spvCmd = {
                "sourceChainId": sourceChainId,
                "targetChainId": targetChainId, 
                "requestKey": pactId 
            };
            return spvCmd;
        }else{
            return reqkeyResult?.result??reqkeyResult;
        }
    }

    const fetchProof = async (spvCmd) => {
        let proof = await Pact.fetch.spv(spvCmd, hostAddrCp(spvCmd.sourceChainId));
        if(proof !== 'SPV target not reachable: target chain not reachable. Chainweb instance is too young'){
            try{
                const jsonstr = atob(proof);
                const obj = JSON.parse(jsonstr);
                return obj.algorithm ? proof : null;
            }catch(err){
                return null;
            }
        }else{
            return null;
        }
    }

    const continueTransfer = async (
        reqKey, 
        proof, 
        step = 1,
        targetChainId
    ) => {
            let metaArgs = [               
                gasStationAccount, 
                String(targetChainId), 
                xGasPrice, 
                xGasLimit, 
                creationTime(), 
                ttl
            ];

            const meta = Pact.lang.mkMeta(...metaArgs);

            let sendArgs = {
                type: "cont",
                meta,
                proof, 
                pactId: reqKey, 
                rollback: false, 
                step,
                networkId
            };

            //const keypairs = await getCurrentPrivateKey();
            //if(keypairs !== null) sendArgs['keyPairs'] = [keypairs];
            //console.log(metaArgs, sendArgs);

            const res = await Pact.fetch.send(sendArgs, hostAddrCp(targetChainId));
            if(res.requestKeys === undefined) throw res;
            return res;
    }

    const getAcctDetails = async (accountName = senderAccountName, chainId = senderChainId, retry = 5) => {
        let data = await getLocalData(`(${tokenAddress}.details ${JSON.stringify(accountName)})`, chainId); 

        switch(data?.result?.status){
            case 'success':
                const c = data.result.data;
                const vbalance = isObject(c.balance) ? Number(c.balance.decimal) : c.balance;
                return { ...c, balance: vbalance, chainId, success: 1 };
            case 'unavailable':
                await delay(1000);
            case 'timeout':
                const fn = () => getAcctDetails(accountName, chainId, retry-1);
                const tn = { account: null, guard: null, balance: 0, chainId, success: 0 };
                return retry !== 0 && false ? await fn() : tn;
            default:
                return { account: null, guard: null, balance: 0, chainId, success: 1 };
        }
    }

    const getFullAcctDetails = async (
        accountName = senderAccountName
    ) => {
        const chainsCount = 20;

        return Promise.all((new Array(chainsCount)).fill(0).map((v,i)=>{
            return getAcctDetails(accountName, i)
        })).catch((err)=>{
            throw err;
        });
    }

    const getTotalBalance = async (accountName = senderAccountName) => {
        const chainsCount = 20;

        let balances = await getFullAcctDetails(accountName);
        if(balances.length === chainsCount){
            let rt = balances.reduce((a,c,i)=>{
                const vbalance = isObject(c.balance) ? Number(c.balance.decimal) : c.balance;
                a.balances += vbalance;
                a.details['chain-id-' + c.chainId] = {...c, balance: vbalance};
                if(c.success === 0) {
                    //network and server response are success.
                    a.failures.push(c.chainId); 
                }else{
                    a.successes.push(c.chainId);
                    if(c.guard !== null){
                        a.guards.push(c.chainId);
                        a.preds.add(c.guard.pred);
                        c.guard.keys.forEach(k=>a.keys.add(k));
                    }else{
                        a.noguards.push(c.chainId);
                    }
                }
                return a;
            },{
                'accountName': accountName,
                'balances': 0,
                'details': {},
                'failures': [],  //network or server error...
                'successes': [],
                'preds': new Set(),
                'keys': new Set(),
                'guards': [],
                'noguards': []
            });

            rt.preds = [...rt.preds];
            rt.keys = [...rt.keys];
            return rt;
        }
        return -1;
    }

    const isAvailableAccount = async (accountName = senderAccountName, yourpubkey = keypairs.publicKey) => {
        try{
            const r = await getTotalBalance(accountName);
            const chainsCount = 20; 

            let code = 3;
            if(r.successes.length < chainsCount){
                code = 4; //network error
            }else if(r.guards.length > 0){
                if(r.preds.length === 1 && r.preds[0].toLowerCase() === "keys-all" && r.keys.length === 1){
                    if(r.guards.length === chainsCount) {
                        if(r.keys[0] === yourpubkey){
                            code = 21; //has key and total init.
                        }else{
                            code = 31; //no key and total init.
                        }
                    }else{
                        if(r.keys[0] === yourpubkey){
                            code = 20; //has key and partial init.
                        }else{
                            code = 30; //no key and partial init.
                        }
                    }
                }else{
                    code = 3; //This account does not meet the init-rules
                }
            }else{
                code = 2; //This account not init at all.
            }
            return code;
        }catch(err){
            return 4; //network error.
        }
    }

    const deployContract = async () => {

    }


    const genSignature = ({
        code: pactCode, 
        data: envData, 
        sender = senderAccountName, 
        chainId = senderChainId, 
        caps = [{name:"", args:""}], 
        gasPrice = gasPrice,  
        gasLimit = gasLimit, 
        ttl = ttl, 
        networkId = networkId
    }) => {
        //arguments: https://kadena-io.github.io/signing-api/#/definitions/SigningRequest
        //returnValue: https://kadena-io.github.io/signing-api/#/definitions/SigningResponse
        
        const signedCmd = Pact.api.prepareExecCmd(
            [{
                publicKey: keypairs.publicKey,
                secretKey: keypairs.secretKey, 
                clist: caps
            }],
            `"${new Date().toISOString()}"`,
            pactCode, envData,
            Pact.lang.mkMeta( 
                sender, String(chainId), 
                gasPrice, gasLimit,
                Math.floor(Date.now() / 1000), ttl,
            ),
            networkId,
        );
        signedCmd.chainId = +chainId;
        return signedCmd;
    }


    const listModules = async (chainId = senderChainId) => {
        try{
            let data = await getLocalData(`(list-modules)`, chainId);
            
            switch(data?.result?.status){
                case 'success':
                    return { moduleNames: data.result.data, chainId, success: 1 };
                case 'unavailable':
                    await delay(1000);
                case 'timeout':
                    return { moduleNames: [], chainId, success: 0 };
                default:
                    return { moduleNames: [], chainId, success: 1 };
            }
        }catch(err){
            return { moduleNames: [], chainId, success: 0 };
        }
    }

    const describeModule = async (moduleName = 'coin', chainId = senderChainId) => {
        try{
            let data = await getLocalData(`(describe-module "${moduleName}")`, chainId);

            switch(data?.result?.status){
                case 'success':
                    return { data: data.result.data, chainId, success: 1 };
                case 'unavailable':
                    await delay(1000);
                case 'timeout':
                    return { data: null, chainId, success: 0 };
                default:
                    return { data: null, chainId, success: 1 };
            }
        }catch(err){
            return { data: null, chainId, success: 0 };
        }
    }


    return {
        initAccount,
        transferCrosschain,
        transferSamechain,
        selectReqkey,
        createSpvCmd,
        fetchProof,
        continueTransfer,
        getAcctDetails,
        getFullAcctDetails,
        getTotalBalance,
        deployContract,
        isAvailableAccount,
        genSignature,
        listModules,
        describeModule
    }
}


