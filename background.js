'use strict';

// Create context menu items when extension is installed or started
chrome.runtime.onInstalled.addListener(createContextMenu);
chrome.runtime.onStartup.addListener(createContextMenu);

function createContextMenu() {
    chrome.contextMenus.removeAll(() => {
        // Create parent menu item
        chrome.contextMenus.create({
            id: 'saveAsFormat',
            title: 'Save Image as',
            contexts: ['image']
        });

        // Create sub-menu items for each format
        const formats = [
            { id: 'png', title: 'PNG' },
            { id: 'jpeg', title: 'JPEG' },
            { id: 'webp', title: 'WebP' },
            { id: 'bmp', title: 'BMP' }
        ];

        formats.forEach(format => {
            chrome.contextMenus.create({
                id: format.id,
                parentId: 'saveAsFormat',
                title: format.title,
                contexts: ['image']
            });
        });
    });
}

function getFileNameWithNewFormat(url, format) {
    const reURI = /^(?:([^:]+:)?\/\/[^/]+)?([^?#]*)(\?[^#]*)?(#.*)?$/;
    const reFilename = /[^/?#=]+\.[^/?#=]+(?=([?#].*)?$)/i;
    
    const splitURI = reURI.exec(url);
    let suggestedFilename = reFilename.exec(splitURI[2] || '') || ['image'];
    
    // Remove the old extension and add new one
    suggestedFilename = suggestedFilename[0].replace(/\.[^/.]+$/, '') + '.' + format;
    
    return suggestedFilename;
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    const format = info.menuItemId;
    convertAndDownloadImage(info.srcUrl, format, tab.id);
});

async function convertAndDownloadImage(srcUrl, format, tabId) {
    try {
        // Execute conversion in the content script
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId },
            func: async (url, format) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                try {
                    const response = await fetch(url);
                    const blob = await response.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    
                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                        img.src = blobUrl;
                    });

                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    
                    const dataUrl = canvas.toDataURL(`image/${format}`);
                    URL.revokeObjectURL(blobUrl);
                    
                    return dataUrl;
                } catch (error) {
                    throw new Error('Failed to convert image');
                }
            },
            args: [srcUrl, format]
        });

        if (result) {
            const filename = getFileNameWithNewFormat(srcUrl, format);
            await chrome.downloads.download({
                url: result,
                filename: filename,
                saveAs: true
            });
        }
    } catch (error) {
        console.error('Conversion failed:', error);
    }
}