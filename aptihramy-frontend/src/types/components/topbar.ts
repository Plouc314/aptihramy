export interface TopBarTrackingChainProps {
    resetZoom: Function;
    goToEditPage: Function;
    title: string;
}

export interface TopBarEditPageProps {
    save: Function;
    title: string;
}

export interface TopBarProps {
    goBackBtn: boolean;
    title: string;
}
