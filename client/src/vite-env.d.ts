/// <reference types="vite/client" />

interface Window {
	electronAPI?: {
		isDesktop: boolean;
		platform: string;
	};
}
