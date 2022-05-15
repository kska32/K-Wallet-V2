import Pact from 'pact-lang-api';
import {delay, getCurrentPrivateKey, isObject, isString} from "./utils";


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
    tokenAddress = 'coin',
    interfaces = []
}){
    const KeysetName = 'kw';
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

    let gasStationAccount = "kadena-xchain-gas"; //free-x-chain-gas

    const creationTime = () => (Math.round(Date.now() / 1000) - 15);
    const getPubKey = (accAddr="") => (accAddr.toLowerCase().includes("k:") ? accAddr.split(":")[1] : accAddr);
    const formatAmount = (amount) => (Math.floor(amount * 1e8) / 1e8).toFixed(8);
    const mkClistKeypairs = (kps,clist) => (isObject(kps) ? [kps] : kps).map(kp=>({...kp, clist}));

    const getLocalData = (pactCode, chainId = senderChainId) => {
        return Promise.race([
            Pact.fetch.local({
                pactCode,
                meta: Pact.lang.mkMeta("", String(chainId), gasPrice, gasLimit, ttl, creationTime()),
            }, hostAddrCp(chainId)).then((r)=>(isString(r) ? {result: {status: 'unavailable'}} : r)),
            delay(3000, {result: {status: 'timeout'}})
        ])
    }

    const setKeypairs = ($keypairs)=>{
        keypairs = $keypairs;
    }

    const initAccount = async (
        chainId = senderChainId, 
        accountName = senderAccountName, 
        guard = {
            "pred": "keys-all",
            "keys": [keypairs?.publicKey??(keypairs[0]?.publicKey)]
        }
    )=>{
        const cmds = [
            {
                keyPairs: [],
                pactCode: `(${tokenAddress}.create-account ${JSON.stringify(accountName)} (read-keyset '${KeysetName}))`,
                networkId: networkId,
                envData: {
                    [KeysetName]: guard
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
                    pactCode: `(${tokenAddress}.transfer-crosschain ${JSON.stringify(senderAccountName)} ${JSON.stringify(receiverAccountName)} (read-keyset "${KeysetName}") ${JSON.stringify(receiverChainId)} ${formatAmount(amount)})`,
                    networkId: networkId,

                    keyPairs: mkClistKeypairs(keypairs, [
                            (interfaces.includes('fungible-xchain-v1')
                                ? {
                                    name: `${tokenAddress}.TRANSFER_XCHAIN`,
                                    args: [senderAccountName, receiverAccountName, Number(formatAmount(amount)), receiverChainId]
                                }  
                                : {
                                    name: `${tokenAddress}.DEBIT`, 
                                    args: [senderAccountName]
                                }
                            ),
                            {
                                name: `${tokenAddress}.GAS`,
                                args: []
                            }
                        ]),
                    meta: Pact.lang.mkMeta(senderAccountName, String(senderChainId), gasPrice, gasLimit, creationTime(), ttl),
                    envData: {
                        [KeysetName]: guard || {
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
                pactCode: `(${tokenAddress}.transfer-create ${JSON.stringify(senderAccountName)} ${JSON.stringify(receiverAccountName)} (read-keyset "${KeysetName}") ${formatAmount(amount)})`,
                networkId: networkId,
                keyPairs: mkClistKeypairs(keypairs, [
                    {
                            name: `${tokenAddress}.TRANSFER`,
                            args: [senderAccountName, receiverAccountName, Number(formatAmount(amount))]
                        },
                        {
                            name: `${tokenAddress}.GAS`,
                            args: []
                        }
                    ]),
                meta: Pact.lang.mkMeta(senderAccountName, String(senderChainId), gasPrice, gasLimit, creationTime(), ttl),
                envData: {
                    [KeysetName]: guard || {
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
            rt.code = 3;
            return rt;
        }else{
            return {code: 4};
        }
    }

    const isAvailableAccount = async (accountName = senderAccountName, yourpubkey = keypairs.publicKey) => {
        let r = {};
        try{
            r = await getTotalBalance(accountName);
            const chainsCount = 20; 
            let code = null;
            if(r.successes.length < chainsCount){
                code = 4;
            }else if(r.guards.length > 0){
                if(r.preds.length === 1 && r.preds[0].toLowerCase() === "keys-all" && r.keys.length === 1){
                    if(r.guards.length === chainsCount) {
                        //21; 此账户的拥有者是你本人, 已初始化全部链条. //31; 此账户被别人抢先， 已初始化全部链条
                        code = r.keys[0] === yourpubkey ? 21 : 31;
                    }else{
                        //20; 此账户的拥有者是你本人, 已初始化部分链条. //30; 此账户被别人抢先， 已初始化部分链条
                        code = r.keys[0] === yourpubkey ? 20 : 30;
                    }
                }else{
                    code = 3; //此账户不符合初始化规则
                }
            }else{
                code = 2; //此账户完全未初始化。
            }

            r.code = code;
            r.available = +String(r.code)[0];
            return r;
        }catch(err){
            r.code = r.available = 4;
            return r; //网络出错。
        }
    }

    const deployContract = async () => {

    }


    const genSignature = ({
        pactCode, 
        envData, 
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
            mkClistKeypairs(keypairs, caps),
            `"${new Date().toISOString()}"`,
            pactCode, 
            envData,
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

    const rotate = async (            
        newGuard = {
            "pred": null,
            "keys": null
        }
    ) => {
        const cmds = [
            {
                pactCode: `(${tokenAddress}.rotate ${JSON.stringify(senderAccountName)} (read-keyset "${KeysetName}"))`,
                networkId: networkId,
                keyPairs: mkClistKeypairs(keypairs, [
                    {
                        name: `${tokenAddress}.ROTATE`,
                        args: [senderAccountName]
                    },
                    {
                        name: `${tokenAddress}.GAS`,
                        args: []
                    }
                ]),
                meta: Pact.lang.mkMeta(senderAccountName, String(senderChainId), gasPrice, gasLimit, creationTime(), ttl),
                envData: {
                    [KeysetName]: newGuard
                }
            }
        ];

        let res = await Pact.fetch.send(cmds, hostAddrCp(senderChainId));
        if(res.requestKeys === undefined) throw res;
        return res;
    }


    return {
        setKeypairs,
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
        describeModule,
        rotate
    }
}


