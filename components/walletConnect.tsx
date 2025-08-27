"use client"
import { ConnectButton } from '@rainbow-me/rainbowkit';

export const WalletConnect = () => {

    return (
        <ConnectButton.Custom>
            {({
                account,
                chain,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
            }) => {
                const ready = mounted && authenticationStatus !== 'loading';
                const connected =
                    ready &&
                    account &&
                    chain &&
                    (!authenticationStatus ||
                        authenticationStatus === 'authenticated');
                return (
                    <div
                        {...(!ready && {
                            'aria-hidden': true,
                            'style': {
                                opacity: 0,
                                pointerEvents: 'none',
                                userSelect: 'none',
                            },
                        })}
                        className='flex justify-center items-center'
                    >
                        {(() => {
                            if (!connected) {
                                return (
                                    <div className='flex fixed bottom-10 justify-center items-center'>
                                        <button onClick={openConnectModal} type="button">
                                            <div className="font-funnel-display text-xl fixed bottom-20 right-50">
                                                _ CONNECT WALLET _
                                            </div>
                                        </button>
                                    </div>


                                );
                            }
                            if (chain.unsupported) {
                                return (
                                    <div className='flex fixed bottom-10 justify-center items-center'>
                                        <button onClick={openChainModal} type="button" className="font-funnel-display text-xl fixed bottom-20 right-50">
                                            _ WRONG NETWORK _
                                        </button>
                                    </div>
                                );
                            }
                        })()}
                    </div>
                );
            }}
        </ConnectButton.Custom>
    );
};