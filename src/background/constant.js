
const C = {
    MAX_GAS_PRICE: 1e-5,
    MIN_GAS_PRICE: 1e-8,

    MAX_GAS_LIMIT: 1e5,
    MIN_GAS_LIMIT: 400,

    MIN_AMOUNT: 1e-6,

    LISTEN_MAX_DELAY: 180,
    LISTEN_EACH_DELAY: 5,

    MSG_GET_STATE: "GET_STATE",
    MSG_SET_STATE: "SET_STATE",

    MSG_SAVE_PASS: "SAVE_PASS",
    MSG_VERIFY_PASSWORD: "VERIFY_PASSWORD",
    MSG_HAS_ACCOUNT: "HAS_ACCOUNT", //#
    MSG_LOCK_UP: "LOCK_UP",
    MSG_GET_ACCOUNT_DETAILS: "GET_ACCOUNT_DETAILS",
    MSG_GET_ACCOUNT_DETAILS_B: 'GET_ACCOUNT_DETAILS_B',
    MSG_JUST_TRANSFER: "JUST_TRANSFER",
    MSG_CONTINUE_ERROR_TRANSFER: 'CONTINUE_ERROR_TRANSFER',
    MSG_GET_RECENT_REQKEYS_DATA: "GET_RECENT_REQKEYS_DATA",
    MSG_UPSERT_A_RECEIVER_ADDR: "UPSERT_A_RECEIVER_ADDR",
    MSG_CREATE_NEW_TAB: "CREATE_NEW_TAB",
    MSG_GENERATE_RANDOM_KEYPAIR: "GENERATE_RANDOM_KEYPAIR",
    MSG_GET_KDA_PRICE: "GET_KDA_PRICE",

    MSG_CHANGE_SELECTED_ACCOUNT: "CHANGE_DEFAULT_ACCOUNT",
    MSG_REMOVE_ACCOUNT: "REMOVE_ACCOUNT",
    MSG_REMOVE_RECEIVER_ACCOUNT_NAME: 'REMOVE_RECEIVER_ACCOUNT_NAME',
    MSG_GET_PRIVATE_KEY: "GET_PRIVATE_KEY",
    MSG_VERIFY_PRIVATE_KEY: 'VERIFY_PRIVATE_KEY',
    MSG_IMPORT_PRIVATE_KEY: 'IMPORT_PRIVATE_KEY',
    MSG_INIT_ACCOUNT: 'INIT_ACCOUNT',
    MSG_VALIDATE_CURRENT_PASSWORD: 'VALIDATE_CURRENT_PASSWORD',
    MSG_CHANGE_PASSWORD: 'CHANGE_PASSWORD',
    MSG_GET_NETWORKID: 'GET_DEFAULT_NETWORKID',
    MSG_CHANGE_NETWORKID: 'CHANGE_NETWORKID',
    MSG_GET_AUTOLOCK_PERIOD: 'GET_AUTOLOCK_PERIOD',
    MSG_SET_AUTOLOCK_PERIOD: 'SET_AUTOLOCK_PERIOD',
    
    MSG_GET_DARK_MODE: 'GET_DARK_MODE',
    MSG_SET_DARK_MODE: 'SET_DARK_MODE',

    MSG_REMOVE_A_TX_RESULT: 'REMOVE_A_TX_RESULT',
    MSG_GET_FUNGIBLE_V2_TOKEN_LIST: 'GET_FUNGIBLE_V2_LIST',
    MSG_CHANGE_FUNGIBLE_V2_TOKEN_ADDR: 'CHANGE_FUNGIBLE_V2_TOKEN_ADDRESS',
    MSG_UPDATE_FUNGIBLE_V2_TOKEN_ADDR_LIST: 'UPDATE_FUNGIBLE_V2_TOKEN_ADDRESS_LIST',

    MSG_OPEN_POPUP_WINDOW: 'OPEN-POPUP-WINDOW-V2',
    MSG_OPEN_POPUP_WINDOW_RESPONSE: 'OPEN-POPUP-WINDOW-RESPONSE',
    MSG_REQ_USERDATA_FROM_WEBPAGE: 'GET_USERDATA_FROM_WEBPAGE',

    FMSG_TRANSFER_PROGRESS: "TRANSFER_PROGRESS",
    FMSG_ACCOUNT_DETAILS_REFRESH: "ACCOUNT_DETAILS_REFRESH",
    FMSG_UPDATE_KEYPAIR_LIST: "UPDATE_KEYPAIR_LIST",
    FMSG_REFRESH_RECEIVER_ADDRS: "REFRESH_RECEIVER_ADDRS",
    FMSG_RECEIVER_ADDR_LIST_UPDATED: "RECEIVER_ADDR_LIST_UPDATED",

    FMSG_GENERATE_RANDOM_KEYPAIR: "GENERATE_RANDOM_KEYPAIR_SUCCESS",
    FMSG_CHANGE_SELECTED_ACCOUNT_SUCCESS: "CHANGE_SELECTED_ACCOUNT_SUCCESS",
    FMSG_REMOVE_ACCOUNT_SUCCESS: "REMOVE_ACCOUNT_SUCCESS",
    FMSG_IMPORT_ACCOUNT_SUCCESS: "IMPORT_ACCOUNT_SUCCESS",
    FMSG_LOCK_UP_SUCCESS: "LOCK_UP_SUCCESS",
    FMSG_LOCK_PROGRESS_STATE: "LOCK_PROGRESS_STATE",
    FMSG_INIT_ACCOUNT_SUCCESS: "INIT_ACCOUNT_SUCCESS",
    FMSG_SYNC_BACKGROUND_STATE: "SYNC_BACKGROUND_STATE",

    WORDS_NOT_EXIST_RECEIVER_ACOUNT: "Transfers to non-existing receiver's accounts are not allowed, except for k:accounts.",
    WORDS_SENDER_HAS_NOT_ENOUGH_KEYPAIR: "The sender does not have enough keypairs to excute this transaction.",
    WORDS_SENDER_ACCOUNT_DOES_NOT_EXISTS: "The sender account does not exist.",
    WORDS_PUBKEY_NOT_MATCH_SENDER_GUARD: "The signing public key does not match the sender's guard.",

    TX_SAME_TRANSFER: "s-transfer",
    TX_CROSS_TRANSFER: "x-transfer",
    TX_ROTATE: "rotate",
    TX_CREATE_ACCOUNT: "create-account"
};



const defaultDetails = Array(20)
    .fill(0)
    .map(
        (v,i)=>({
            account: null, 
            balance: 0, 
            chainId: i, 
            guard: null, 
            success: 1
        })
    );


export const BackgroundState = {
        networkId: 'mainnet01', 
        tokenAddress: 'coin',
        tokenAddressList: ['coin'],
        limitTime: 1000 * 60 * 15,
        pageNum: 0,

        isDark: false,
        password: '',
        passwordConfirm: '',

        mnemonic01: [], 
        mnemonic02: [], 
        mnemonic03: [],

        passwordR: '',
        passwordConfirmR: '',
        mnemonicR: [],
        accountName: '',
        keypairHex: {
            publicKey: '',
            secretKey: ''
        },
        keypairBuf: {
            publicKey: '',
            secretKey: ''
        },
        keypairList: [],//[keypairHex,keypairHex={},..]
        accountDetails: {
            details: defaultDetails,
            sum: 0,
            nullChainIds: [],
            accountAddr: '',
            error: null,
            networkId: null
        },
        accountDetailsB: {
            details: defaultDetails,
            sum: 0,
            nullChainIds: [],
            accountAddr: '',
            error: null,
            networkId: null
        },
        isLoading: {
            opened: false,
            text: null,
            timestamp: null
        },
        kdausdt: 0,
        transferConfirmOpened: false,
        globalErrorData: {
            //modal
            opened: false,
            message: ''
        },
        errorData: {
            //modal
            opened: false,
            message: null,
            xtransfer: null,
            details: null
        },
        infoData: {
            //modal
            opened: false,
            details: null,
            reqkey: null
        },
        confirmData: {
            //modal
            opened: false,
            message: null,
            confirmed: null
        },
        deleteData: {
            //modal
            opened: false,
            publicKey: '',
            privateKey: '',
            success: null,
        },
        switchAccountBoxOpened: false,
        transferOpt: {
            senderAccountName: '',
            senderChainId: 0,
            receiverAccountName: '',
            receiverChainId: 0,
            amount: 0.1,
            gasPayingAccountA: '',
            gasPayingAccountB: '',
            gasPrice: 0.00000001,
            gasLimit: 600,
            xGasPrice: undefined,
            xGasLimit: undefined,
            ttl: 28800
        },
        senderAddrList: [], //[{text: 'k:'+v.key, value: 'k:'+v.key, key: i+1},..]
        receiverAddrList: [],
        sidebar: {
            opened: false
        },
        privateKeyPage: {
            opened: false
        },
        importPriKeyPage: {
            opened: false
        },
        changePasswordPage: {
            opened: false
        }
    }


export default Object.freeze(C);

