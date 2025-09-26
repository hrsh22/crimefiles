"use client";
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
                    (!authenticationStatus || authenticationStatus === 'authenticated');

                return (
                    <div
                        {...(!ready && {
                            'aria-hidden': true,
                            style: {
                                opacity: 0,
                                pointerEvents: 'none',
                                userSelect: 'none',
                            },
                        })}
                        className="flex justify-center items-center"
                    >
                        {(() => {
                            if (!connected) {
                                return (
                                    <button
                                        onClick={openConnectModal}
                                        type="button"
                                        className="border border-white/60 hover:border-white px-5 py-2 font-funnel-display text-white/90 bg-black/30 backdrop-blur"
                                    >
                                        Connect Wallet
                                    </button>
                                );
                            }
                            if (chain.unsupported) {
                                return (
                                    <button
                                        onClick={openChainModal}
                                        type="button"
                                        className="border border-white/60 hover:border-white px-5 py-2 font-funnel-display text-white/90 bg-black/30 backdrop-blur"
                                    >
                                        Switch Network
                                    </button>
                                );
                            }
                            return (
                                <button
                                    onClick={openChainModal}
                                    type="button"
                                    className="border border-white/40 hover:border-white px-5 py-2 font-funnel-display text-white/90 bg-black/30 backdrop-blur"
                                >
                                    {account.displayName}
                                </button>
                            );
                        })()}
                    </div>
                );
            }}
        </ConnectButton.Custom>
    );
};
