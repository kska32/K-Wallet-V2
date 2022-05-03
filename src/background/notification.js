import C from "./constant";

export function pushNoti(txid, param){
    const amount = param.amount;
    const sender = param?.senderAccountName?.slice(0,8)??"";
    const receiver = param?.receiverAccountName?.slice(0,8)??"";
    const {senderChainId, receiverChainId, txType} = param;
    let message = '';

    switch(txType){
        case C.TX_SAME_TRANSFER:
        case C.TX_CROSS_TRANSFER:
            message = `${sender}...#${senderChainId} ⇨ ${receiver}...#${receiverChainId}\nKDA: ${amount}`; 
            break;
        case C.TX_ROTATE:
            message = `${sender}...#${senderChainId}: changed ownership ok.`; 
            break;
    }

    let args = [
        txid, 
        {
            type: 'basic',
            iconUrl: '../icons/k128.png',
            title: 'Tx Successful',
            message,
            priority: 2,
            eventTime: Date.now(),
            contextMessage: 'K-Wallet V2'
        }, 
        (id)=>{
            //
        }
    ];

    chrome.notifications.create(...args);
    /*
    chrome.notifications.onClicked.addListener((reqkey)=>{
        const exploreLink = (reqKey,networkId)=>{
            const networkName = networkId.indexOf("mainnet") > -1 ? 'mainnet' : 'testnet';
            return  `https://explorer.chainweb.com/${networkName}/tx/${reqKey}`;
        };
        window.open(exploreLink(reqkey, param.networkId), "_blank");
    });
    */
}



