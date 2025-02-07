// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

'use strict';

import * as WindowManager from 'main/windows/windowManager';

import {createTemplate} from './app';

jest.mock('electron', () => ({
    app: {
        name: 'AppName',
        getVersion: () => '5.0.0',
    },
}));

jest.mock('main/windows/windowManager', () => ({
    getCurrentTeamName: jest.fn(),
}));

jest.mock('common/tabs/TabView', () => ({
    getTabDisplayName: (name) => name,
}));

describe('main/menus/app', () => {
    const config = {
        data: {
            enableServerManagement: true,
            teams: [{
                name: 'example',
                url: 'http://example.com',
                order: 0,
                tabs: [
                    {
                        name: 'TAB_MESSAGING',
                        order: 0,
                        isOpen: true,
                    },
                    {
                        name: 'TAB_FOCALBOARD',
                        order: 1,
                        isOpen: true,
                    },
                    {
                        name: 'TAB_PLAYBOOKS',
                        order: 2,
                        isOpen: true,
                    },
                ],
                lastActiveTab: 0,
            }, {
                name: 'github',
                url: 'https://github.com/',
                order: 1,
                tabs: [
                    {
                        name: 'TAB_MESSAGING',
                        order: 0,
                        isOpen: true,
                    },
                    {
                        name: 'TAB_FOCALBOARD',
                        order: 1,
                        isOpen: true,
                    },
                    {
                        name: 'TAB_PLAYBOOKS',
                        order: 2,
                        isOpen: true,
                    },
                ],
                lastActiveTab: 0,
            }],
            helpLink: 'http://link-to-help.site.com',
        },
    };

    describe('mac only', () => {
        let originalPlatform;
        beforeAll(() => {
            originalPlatform = process.platform;
            Object.defineProperty(process, 'platform', {
                value: 'darwin',
            });
        });

        afterAll(() => {
            Object.defineProperty(process, 'platform', {
                value: originalPlatform,
            });
        });

        it('should have first menu name as AppName', () => {
            const menu = createTemplate(config);
            const appNameMenu = menu.find((item) => item.label === '&AppName');
            expect(appNameMenu).not.toBe(undefined);
        });

        it('should include About <appname> in menu on mac', () => {
            const menu = createTemplate(config);
            const appNameMenu = menu.find((item) => item.label === '&AppName');
            const menuItem = appNameMenu.submenu.find((item) => item.label === 'About AppName');
            expect(menuItem).not.toBe(undefined);
            expect(menuItem.role).toBe('about');
        });

        it('should contain hide options', () => {
            const menu = createTemplate(config);
            const appNameMenu = menu.find((item) => item.label === '&AppName');
            expect(appNameMenu.submenu).toContainEqual({role: 'hide'});
            expect(appNameMenu.submenu).toContainEqual({role: 'unhide'});
            expect(appNameMenu.submenu).toContainEqual({role: 'hideOthers'});
        });

        it('should contain zoom and front options in Window', () => {
            const menu = createTemplate(config);
            const windowMenu = menu.find((item) => item.label === '&Window');
            expect(windowMenu.role).toBe('windowMenu');
            expect(windowMenu.submenu).toContainEqual({role: 'zoom'});
            expect(windowMenu.submenu).toContainEqual({role: 'front'});
        });
    });

    it('should show `Sign in to Another Server` if `enableServerManagement` is true', () => {
        const menu = createTemplate(config);
        const fileMenu = menu.find((item) => item.label === '&AppName' || item.label === '&File');
        const signInOption = fileMenu.submenu.find((item) => item.label === 'Sign in to Another Server');
        expect(signInOption).not.toBe(undefined);
    });

    it('should not show `Sign in to Another Server` if `enableServerManagement` is false', () => {
        const modifiedConfig = {
            ...config,
            enableServerManagement: false,
        };
        const menu = createTemplate(modifiedConfig);
        const fileMenu = menu.find((item) => item.label === '&AppName' || item.label === '&File');
        const signInOption = fileMenu.submenu.find((item) => item.label === 'Sign in to Another Server');
        expect(signInOption).not.toBe(undefined);
    });

    it('should show the first 9 servers (using order) in the Window menu', () => {
        const modifiedConfig = {
            data: {
                ...config.data,
                teams: [...Array(15).keys()].map((key) => ({
                    name: `server-${key}`,
                    url: `http://server-${key}.com`,
                    order: (key + 5) % 15,
                    lastActiveTab: 0,
                    tab: [
                        {
                            name: 'TAB_MESSAGING',
                            isOpen: true,
                        },
                    ],
                })),
            },
        };
        const menu = createTemplate(modifiedConfig);
        const windowMenu = menu.find((item) => item.label === '&Window');
        for (let i = 10; i < 15; i++) {
            const menuItem = windowMenu.submenu.find((item) => item.label === `server-${i}`);
            expect(menuItem).not.toBe(undefined);
        }
        for (let i = 0; i < 4; i++) {
            const menuItem = windowMenu.submenu.find((item) => item.label === `server-${i}`);
            expect(menuItem).not.toBe(undefined);
        }
        for (let i = 4; i < 10; i++) {
            const menuItem = windowMenu.submenu.find((item) => item.label === `server-${i}`);
            expect(menuItem).toBe(undefined);
        }
    });

    it('should show the first 9 tabs (using order) in the Window menu', () => {
        WindowManager.getCurrentTeamName.mockImplementation(() => config.data.teams[0].name);

        const modifiedConfig = {
            data: {
                ...config.data,
                teams: [
                    {
                        ...config.data.teams[0],
                        tabs: [...Array(15).keys()].map((key) => ({
                            name: `tab-${key}`,
                            isOpen: true,
                            order: (key + 5) % 15,
                        })),
                    },
                ],
            },
        };
        const menu = createTemplate(modifiedConfig);
        const windowMenu = menu.find((item) => item.label === '&Window');
        for (let i = 10; i < 15; i++) {
            const menuItem = windowMenu.submenu.find((item) => item.label === `    tab-${i}`);
            expect(menuItem).not.toBe(undefined);
        }
        for (let i = 0; i < 4; i++) {
            const menuItem = windowMenu.submenu.find((item) => item.label === `    tab-${i}`);
            expect(menuItem).not.toBe(undefined);
        }
        for (let i = 4; i < 10; i++) {
            const menuItem = windowMenu.submenu.find((item) => item.label === `    tab-${i}`);
            expect(menuItem).toBe(undefined);
        }
    });
});
