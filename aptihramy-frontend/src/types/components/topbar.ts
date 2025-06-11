export interface TopBarProps {
    resetZoom?: Function;
    goToEditPage?: Function;
    title: string;
}

export interface TopBarTrackingChainProps {
    resetZoom: Function;
    goToEditPage: Function;
    title: string;
}

export interface TopBarEditPageProps {
    save: Function;
    title: string;
}
