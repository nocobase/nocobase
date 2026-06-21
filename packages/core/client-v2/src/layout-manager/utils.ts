/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export function getLayoutPageRouteName(routeName: string) {
  return `${routeName}.__page`;
}

export function getLayoutPageTabRouteName(routeName: string) {
  return `${routeName}.__pageTab`;
}

export function getLayoutPageViewRouteName(routeName: string) {
  return `${routeName}.__pageView`;
}

export function getLayoutPageTabViewRouteName(routeName: string) {
  return `${routeName}.__pageTabView`;
}

export function getLayoutContentRouteNames(routeName: string) {
  return [
    getLayoutPageRouteName(routeName),
    getLayoutPageTabRouteName(routeName),
    getLayoutPageViewRouteName(routeName),
    getLayoutPageTabViewRouteName(routeName),
  ];
}

export function isLayoutContentRouteName(routeName: string, targetRouteName?: string) {
  return !!targetRouteName && getLayoutContentRouteNames(routeName).includes(targetRouteName);
}
