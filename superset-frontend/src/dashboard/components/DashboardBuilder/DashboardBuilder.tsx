/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
/* eslint-env browser */
import cx from 'classnames';
import React, {
  FC,
  useCallback,
  useEffect,
  useState,
  useMemo,
  useRef,
} from 'react';
import { JsonObject, styled, css, t } from '@superset-ui/core';
import { Global } from '@emotion/react';
import { useDispatch, useSelector } from 'react-redux';
import ErrorBoundary from 'src/components/ErrorBoundary';
import BuilderComponentPane from 'src/dashboard/components/BuilderComponentPane';
import DashboardHeader from 'src/dashboard/containers/DashboardHeader';
import Icons from 'src/components/Icons';
import IconButton from 'src/dashboard/components/IconButton';
import DragDroppable from 'src/dashboard/components/dnd/DragDroppable';
import DashboardComponent from 'src/dashboard/containers/DashboardComponent';
import WithPopoverMenu from 'src/dashboard/components/menu/WithPopoverMenu';
import getDirectPathToTabIndex from 'src/dashboard/util/getDirectPathToTabIndex';
import { URL_PARAMS } from 'src/constants';
import { getUrlParam } from 'src/utils/urlUtils';
import { DashboardLayout, RootState } from 'src/dashboard/types';
import {
  setDirectPathToChild,
  setEditMode,
} from 'src/dashboard/actions/dashboardState';
import { useElementOnScreen } from 'src/hooks/useElementOnScreen';
import { FeatureFlag, isFeatureEnabled } from 'src/featureFlags';
import {
  deleteTopLevelTabs,
  handleComponentDrop,
} from 'src/dashboard/actions/dashboardLayout';
import {
  DASHBOARD_GRID_ID,
  DASHBOARD_ROOT_ID,
  DASHBOARD_ROOT_DEPTH,
  DashboardStandaloneMode,
} from 'src/dashboard/util/constants';
import FilterBar from 'src/dashboard/components/nativeFilters/FilterBar';
import Loading from 'src/components/Loading';
import { EmptyStateBig } from 'src/components/EmptyState';
import { useUiConfig } from 'src/components/UiConfigContext';
import ResizableSidebar from 'src/components/ResizableSidebar';
import {
  BUILDER_SIDEPANEL_WIDTH,
  CLOSED_FILTER_BAR_WIDTH,
  FILTER_BAR_HEADER_HEIGHT,
  FILTER_BAR_TABS_HEIGHT,
  MAIN_HEADER_HEIGHT,
  OPEN_FILTER_BAR_WIDTH,
  OPEN_FILTER_BAR_MAX_WIDTH,
} from 'src/dashboard/constants';
import { shouldFocusTabs, getRootLevelTabsComponent } from './utils';
import DashboardContainer from './DashboardContainer';
import { useNativeFilters } from './state';

type DashboardBuilderProps = {};

const StyledDiv = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto 1fr;
  flex: 1;
  /* Special cases */

  /* A row within a column has inset hover menu */
  .dragdroppable-column .dragdroppable-row .hover-menu--left {
    left: -12px;
    background: ${({ theme }) => theme.colors.grayscale.light5};
    border: 1px solid ${({ theme }) => theme.colors.grayscale.light2};
  }

  .dashboard-component-tabs {
    position: relative;
  }

  /* A column within a column or tabs has inset hover menu */
  .dragdroppable-column .dragdroppable-column .hover-menu--top,
  .dashboard-component-tabs .dragdroppable-column .hover-menu--top {
    top: -12px;
    background: ${({ theme }) => theme.colors.grayscale.light5};
    border: 1px solid ${({ theme }) => theme.colors.grayscale.light2};
  }

  /* move Tabs hover menu to top near actual Tabs */
  .dashboard-component-tabs > .hover-menu-container > .hover-menu--left {
    top: 0;
    transform: unset;
    background: transparent;
  }

  /* push Chart actions to upper right */
  .dragdroppable-column .dashboard-component-chart-holder .hover-menu--top,
  .dragdroppable .dashboard-component-header .hover-menu--top {
    right: 8px;
    top: 8px;
    background: transparent;
    border: none;
    transform: unset;
    left: unset;
  }
  div:hover > .hover-menu-container .hover-menu,
  .hover-menu-container .hover-menu:hover {
    opacity: 1;
  }
`;

// @z-index-above-dashboard-charts + 1 = 11
const FiltersPanel = styled.div<{ width: number }>`
  grid-column: 1;
  grid-row: 1 / span 2;
  z-index: 11;
  width: ${({ width }) => width}px;
`;

const StickyPanel = styled.div<{ width: number }>`
  position: sticky;
  top: -54px;
  width: ${({ width }) => width}px;
  flex: 0 0 ${({ width }) => width}px;
`;

// @z-index-above-dashboard-popovers (99) + 1 = 100
const StyledHeader = styled.div`
  grid-column: 2;
  grid-row: 1;
  position: sticky;
  top: 53px;
  z-index: 100;
  max-width: 100vw;
`;

const StyledContent = styled.div<{
  fullSizeChartId: number | null;
}>`
  grid-column: 2;
  grid-row: 2;
  // @z-index-above-dashboard-header (100) + 1 = 101
  ${({ fullSizeChartId }) => fullSizeChartId && `z-index: 101;`}
`;

const StyledDashboardContent = styled.div<{
  dashboardFiltersOpen: boolean;
  editMode: boolean;
  nativeFiltersEnabled: boolean;
}>`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  height: auto;
  flex: 1;

  .grid-container .dashboard-component-tabs {
    box-shadow: none;
    padding-left: 0;
  }

  .grid-container {
    /* without this, the grid will not get smaller upon toggling the builder panel on */
    width: 0;
    flex: 1;
    position: relative;
    margin-top: ${({ theme }) => theme.gridUnit * 6}px;
    margin-right: ${({ theme }) => theme.gridUnit * 8}px;
    margin-bottom: ${({ theme }) => theme.gridUnit * 6}px;
    margin-left: ${({
      theme,
      dashboardFiltersOpen,
      editMode,
      nativeFiltersEnabled,
    }) => {
      if (!dashboardFiltersOpen && !editMode && nativeFiltersEnabled) {
        return 0;
      }
      return theme.gridUnit * 8;
    }}px;

    ${({ editMode, theme }) =>
      editMode &&
      `
      max-width: calc(100% - ${
        BUILDER_SIDEPANEL_WIDTH + theme.gridUnit * 16
      }px);
    `}
  }

  .dashboard-builder-sidepane {
    width: ${BUILDER_SIDEPANEL_WIDTH}px;
    z-index: 1;
  }

  .dashboard-component-chart-holder {
    // transitionable traits to show filter relevance
    transition: opacity ${({ theme }) => theme.transitionTiming}s,
      border-color ${({ theme }) => theme.transitionTiming}s,
      box-shadow ${({ theme }) => theme.transitionTiming}s;
    border: 0 solid transparent;
  }
`;

const DashboardBuilder: FC<DashboardBuilderProps> = () => {
  const dispatch = useDispatch();
  const uiConfig = useUiConfig();

  const dashboardId = useSelector<RootState, string>(
    ({ dashboardInfo }) => `${dashboardInfo.id}`,
  );
  const dashboardLayout = useSelector<RootState, DashboardLayout>(
    state => state.dashboardLayout.present,
  );
  const editMode = useSelector<RootState, boolean>(
    state => state.dashboardState.editMode,
  );
  const canEdit = useSelector<RootState, boolean>(
    ({ dashboardInfo }) => dashboardInfo.dash_edit_perm,
  );
  const directPathToChild = useSelector<RootState, string[]>(
    state => state.dashboardState.directPathToChild,
  );
  const fullSizeChartId = useSelector<RootState, number | null>(
    state => state.dashboardState.fullSizeChartId,
  );

  const handleChangeTab = useCallback(
    ({ pathToTabIndex }: { pathToTabIndex: string[] }) => {
      dispatch(setDirectPathToChild(pathToTabIndex));
    },
    [dispatch],
  );

  const handleDeleteTopLevelTabs = useCallback(() => {
    dispatch(deleteTopLevelTabs());

    const firstTab = getDirectPathToTabIndex(
      getRootLevelTabsComponent(dashboardLayout),
      0,
    );
    dispatch(setDirectPathToChild(firstTab));
  }, [dashboardLayout, dispatch]);

  const handleDrop = useCallback(
    dropResult => dispatch(handleComponentDrop(dropResult)),
    [dispatch],
  );

  const headerRef = React.useRef<HTMLDivElement>(null);
  const dashboardRoot = dashboardLayout[DASHBOARD_ROOT_ID];
  const rootChildId = dashboardRoot?.children[0];
  const topLevelTabs =
    rootChildId !== DASHBOARD_GRID_ID
      ? dashboardLayout[rootChildId]
      : undefined;
  const standaloneMode = getUrlParam(URL_PARAMS.standalone);
  const isReport = standaloneMode === DashboardStandaloneMode.REPORT;
  const hideDashboardHeader =
    uiConfig.hideTitle ||
    standaloneMode === DashboardStandaloneMode.HIDE_NAV_AND_TITLE ||
    isReport;
  const [barTopOffset, setBarTopOffset] = useState(0);

  useEffect(() => {
    setBarTopOffset(headerRef.current?.getBoundingClientRect()?.height || 0);

    let observer: ResizeObserver;
    if (typeof global.ResizeObserver !== 'undefined' && headerRef.current) {
      observer = new ResizeObserver(entries => {
        setBarTopOffset(
          current => entries?.[0]?.contentRect?.height || current,
        );
      });

      observer.observe(headerRef.current);
    }

    return () => {
      observer?.disconnect();
    };
  }, []);

  const {
    showDashboard,
    dashboardFiltersOpen,
    toggleDashboardFiltersOpen,
    nativeFiltersEnabled,
  } = useNativeFilters();

  const [containerRef, isSticky] = useElementOnScreen<HTMLDivElement>({
    threshold: [1],
  });

  const filterSetEnabled = isFeatureEnabled(
    FeatureFlag.DASHBOARD_NATIVE_FILTERS_SET,
  );

  const offset =
    FILTER_BAR_HEADER_HEIGHT +
    (isSticky || standaloneMode ? 0 : MAIN_HEADER_HEIGHT) +
    (filterSetEnabled ? FILTER_BAR_TABS_HEIGHT : 0);

  const filterBarHeight = `calc(100vh - ${offset}px)`;
  const filterBarOffset = dashboardFiltersOpen ? 0 : barTopOffset + 20;

  const draggableStyle = useMemo(
    () => ({
      marginLeft:
        dashboardFiltersOpen || editMode || !nativeFiltersEnabled ? 0 : -32,
    }),
    [dashboardFiltersOpen, editMode, nativeFiltersEnabled],
  );

  // If a new tab was added, update the directPathToChild to reflect it
  const currentTopLevelTabs = useRef(topLevelTabs);
  useEffect(() => {
    const currentTabsLength = currentTopLevelTabs.current?.children?.length;
    const newTabsLength = topLevelTabs?.children?.length;

    if (
      currentTabsLength !== undefined &&
      newTabsLength !== undefined &&
      newTabsLength > currentTabsLength
    ) {
      const lastTab = getDirectPathToTabIndex(
        getRootLevelTabsComponent(dashboardLayout),
        newTabsLength - 1,
      );
      dispatch(setDirectPathToChild(lastTab));
    }

    currentTopLevelTabs.current = topLevelTabs;
  }, [topLevelTabs]);

  const renderDraggableContent = useCallback(
    ({ dropIndicatorProps }: { dropIndicatorProps: JsonObject }) => (
      <div>
        {!hideDashboardHeader && <DashboardHeader />}
        {dropIndicatorProps && <div {...dropIndicatorProps} />}
        {!isReport && topLevelTabs && !uiConfig.hideNav && (
          <WithPopoverMenu
            shouldFocus={shouldFocusTabs}
            menuItems={[
              <IconButton
                icon={<Icons.FallOutlined iconSize="xl" />}
                label="Collapse tab content"
                onClick={handleDeleteTopLevelTabs}
              />,
            ]}
            editMode={editMode}
          >
            {/* @ts-ignore */}
            <DashboardComponent
              id={topLevelTabs?.id}
              parentId={DASHBOARD_ROOT_ID}
              depth={DASHBOARD_ROOT_DEPTH + 1}
              index={0}
              renderTabContent={false}
              renderHoverMenu={false}
              onChangeTab={handleChangeTab}
            />
          </WithPopoverMenu>
        )}
      </div>
    ),
    [
      editMode,
      handleChangeTab,
      handleDeleteTopLevelTabs,
      hideDashboardHeader,
      isReport,
      topLevelTabs,
      uiConfig.hideNav,
    ],
  );

  return (
    <StyledDiv>
      {nativeFiltersEnabled && !editMode && (
        <>
          <ResizableSidebar
            id={`dashboard:${dashboardId}`}
            enable={dashboardFiltersOpen}
            minWidth={OPEN_FILTER_BAR_WIDTH}
            maxWidth={OPEN_FILTER_BAR_MAX_WIDTH}
            initialWidth={OPEN_FILTER_BAR_WIDTH}
          >
            {adjustedWidth => {
              const filterBarWidth = dashboardFiltersOpen
                ? adjustedWidth
                : CLOSED_FILTER_BAR_WIDTH;
              return (
                <FiltersPanel
                  width={filterBarWidth}
                  data-test="dashboard-filters-panel"
                >
                  <StickyPanel ref={containerRef} width={filterBarWidth}>
                    <ErrorBoundary>
                      <FilterBar
                        filtersOpen={dashboardFiltersOpen}
                        toggleFiltersBar={toggleDashboardFiltersOpen}
                        directPathToChild={directPathToChild}
                        width={filterBarWidth}
                        height={filterBarHeight}
                        offset={filterBarOffset}
                      />
                    </ErrorBoundary>
                  </StickyPanel>
                </FiltersPanel>
              );
            }}
          </ResizableSidebar>
        </>
      )}
      <StyledHeader ref={headerRef}>
        {/* @ts-ignore */}
        <DragDroppable
          data-test="top-level-tabs"
          component={dashboardRoot}
          parentComponent={null}
          depth={DASHBOARD_ROOT_DEPTH}
          index={0}
          orientation="column"
          onDrop={handleDrop}
          editMode={editMode}
          // you cannot drop on/displace tabs if they already exist
          disableDragDrop={!!topLevelTabs}
          style={draggableStyle}
        >
          {renderDraggableContent}
        </DragDroppable>
      </StyledHeader>
      <StyledContent fullSizeChartId={fullSizeChartId}>
        <Global
          styles={css`
            // @z-index-above-dashboard-header (100) + 1 = 101
            ${fullSizeChartId &&
            `div > .filterStatusPopover.ant-popover{z-index: 101}`}
          `}
        />
        {!editMode &&
          !topLevelTabs &&
          dashboardLayout[DASHBOARD_GRID_ID]?.children?.length === 0 && (
            <EmptyStateBig
              title={t('There are no charts added to this dashboard')}
              description={
                canEdit &&
                t(
                  'Go to the edit mode to configure the dashboard and add charts',
                )
              }
              buttonText={canEdit && t('Edit the dashboard')}
              buttonAction={() => dispatch(setEditMode(true))}
              image="dashboard.svg"
            />
          )}
        <div
          data-test="dashboard-content"
          className={cx('dashboard', editMode && 'dashboard--editing')}
        >
          <StyledDashboardContent
            className="dashboard-content"
            dashboardFiltersOpen={dashboardFiltersOpen}
            editMode={editMode}
            nativeFiltersEnabled={nativeFiltersEnabled}
          >
            {showDashboard ? (
              <DashboardContainer topLevelTabs={topLevelTabs} />
            ) : (
              <Loading />
            )}
            {editMode && (
              <BuilderComponentPane
                isStandalone={!!standaloneMode}
                topOffset={barTopOffset}
              />
            )}
          </StyledDashboardContent>
                    {/* <div className="sopact grid-container bg-white">
            <svg
              width="200"
              height="50"
              viewBox="0 0 130 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M91.2726 10.3167C91.3049 10.7481 91.6285 11.1471 92.2756 11.1471C92.9227 11.1471 92.9981 10.8883 92.9981 10.5971C92.9981 10.3059 92.8256 10.1549 92.405 10.0686L91.6824 9.89608C90.6255 9.66961 90.1402 9.03331 90.1402 8.2676C90.1402 7.28619 91.0138 6.46655 92.2001 6.46655C93.7531 6.46655 94.2815 7.45874 94.3462 8.0519L93.106 8.3323C93.0629 8.00876 92.8256 7.58816 92.2109 7.58816C91.8118 7.58816 91.4991 7.82542 91.4991 8.13818C91.4991 8.45094 91.704 8.56957 92.006 8.63427L92.7825 8.79605C93.8609 9.02252 94.4109 9.68039 94.4109 10.4785C94.4109 11.2765 93.7207 12.2795 92.2864 12.2795C90.6363 12.2795 90.0647 11.2118 90 10.5863L91.2726 10.3167Z"
                fill="#344461"
              />
              <path
                d="M100.914 9.37842C100.914 11.0608 99.6843 12.2795 98.045 12.2795C96.4058 12.2795 95.1655 11.0608 95.1655 9.37842C95.1655 7.69601 96.4058 6.46655 98.045 6.46655C99.6843 6.46655 100.914 7.68522 100.914 9.37842ZM99.4363 9.37842C99.4363 8.34309 98.7676 7.81464 98.045 7.81464C97.3225 7.81464 96.6538 8.34309 96.6538 9.37842C96.6538 10.4137 97.3225 10.9314 98.045 10.9314C98.7676 10.9314 99.4363 10.4137 99.4363 9.37842Z"
                fill="#344461"
              />
              <path
                d="M102.089 14.7819V6.63943H103.524V7.30808C103.772 6.87669 104.386 6.51001 105.206 6.51001C106.813 6.51001 107.741 7.73946 107.741 9.35717C107.741 10.9749 106.705 12.2475 105.152 12.2475C104.397 12.2475 103.836 11.9455 103.567 11.5788V14.7819H102.089ZM104.915 7.83653C104.16 7.83653 103.545 8.40811 103.545 9.37874C103.545 10.3494 104.16 10.9317 104.915 10.9317C105.67 10.9317 106.274 10.3601 106.274 9.37874C106.274 8.39733 105.681 7.83653 104.915 7.83653Z"
                fill="#344461"
              />
              <path
                d="M110.211 8.9686L111.559 8.76369C111.871 8.72055 111.968 8.55878 111.968 8.37544C111.968 7.98719 111.666 7.66365 111.041 7.66365C110.415 7.66365 110.038 8.07347 109.995 8.548L108.679 8.27838C108.776 7.41561 109.563 6.46655 111.03 6.46655C112.777 6.46655 113.414 7.44796 113.414 8.548V11.2442C113.414 11.5366 113.435 11.8285 113.478 12.1177H112.13C112.087 11.9011 112.066 11.6807 112.066 11.4599C111.796 11.8913 111.267 12.2687 110.459 12.2687C109.283 12.2687 108.571 11.4814 108.571 10.6294C108.571 9.77745 109.294 9.09802 110.211 8.9686ZM111.968 9.89608V9.65882L110.728 9.84216C110.351 9.89608 110.049 10.1118 110.049 10.5324C110.049 10.953 110.286 11.1687 110.771 11.1687C111.257 11.1687 111.968 10.8667 111.968 9.89608V9.89608Z"
                fill="#344461"
              />
              <path
                d="M115.958 9.37842C115.958 10.3706 116.606 10.9314 117.36 10.9314C117.645 10.9415 117.924 10.8554 118.153 10.6871C118.382 10.5188 118.547 10.278 118.622 10.0039L119.927 10.4353C119.679 11.352 118.827 12.2903 117.36 12.2903C115.894 12.2903 114.481 11.0608 114.481 9.37842C114.481 7.69601 115.721 6.46655 117.317 6.46655C118.913 6.46655 119.658 7.39404 119.895 8.32152L118.568 8.76369C118.428 8.31073 118.083 7.83621 117.35 7.83621C116.616 7.83621 115.958 8.38623 115.958 9.37842Z"
                fill="#344461"
              />
              <path
                d="M122.85 6.63927H123.939V7.955H122.85V10.2414C122.85 10.7267 123.065 10.8777 123.486 10.8777C123.642 10.8799 123.797 10.8654 123.95 10.8345V12.064C123.684 12.1601 123.402 12.204 123.119 12.1934C122.041 12.1934 121.383 11.5679 121.383 10.5002V7.955H120.391V6.63927H120.66C121.243 6.63927 121.512 6.26181 121.512 5.76571V5H122.85V6.63927Z"
                fill="#344461"
              />
              <path
                d="M74.6184 10.0753C74.4594 10.0753 74.304 10.0282 74.1718 9.93985C74.0396 9.85153 73.9365 9.72598 73.8757 9.57909C73.8148 9.4322 73.7989 9.27057 73.8299 9.11463C73.8609 8.95869 73.9375 8.81544 74.0499 8.70301C74.1623 8.59058 74.3055 8.51401 74.4615 8.48298C74.6174 8.45196 74.7791 8.46787 74.9259 8.52871C75.0728 8.58954 75.1984 8.69258 75.2867 8.82477C75.3751 8.95697 75.4222 9.11239 75.4222 9.27138C75.422 9.48451 75.3372 9.68885 75.1865 9.83956C75.0358 9.99027 74.8315 10.0751 74.6184 10.0753V10.0753ZM74.6184 8.82665C74.5304 8.82665 74.4444 8.85273 74.3713 8.9016C74.2981 8.95046 74.2411 9.01993 74.2074 9.1012C74.1738 9.18247 74.165 9.2719 74.1821 9.35818C74.1993 9.44446 74.2416 9.52371 74.3038 9.58592C74.3661 9.64812 74.4453 9.69048 74.5316 9.70764C74.6179 9.7248 74.7073 9.71599 74.7886 9.68232C74.8698 9.64866 74.9393 9.59164 74.9882 9.5185C75.037 9.44535 75.0631 9.35935 75.0631 9.27138C75.063 9.15348 75.0161 9.04044 74.9327 8.95707C74.8493 8.8737 74.7363 8.8268 74.6184 8.82665V8.82665Z"
                fill="#F67C7C"
              />
              <path
                d="M76.2974 13.559C76.2001 13.559 76.1048 13.5311 76.023 13.4786C75.9411 13.4261 75.8761 13.3512 75.8358 13.2628C75.5753 12.6731 75.4809 12.0236 75.563 11.3843C75.4124 11.3376 75.2586 11.3021 75.1027 11.278C74.6238 11.2028 74.134 11.2389 73.6713 11.3836C73.6908 11.5348 73.7005 11.6871 73.7004 11.8395C73.7017 12.3292 73.5994 12.8136 73.4002 13.2611C73.3711 13.3258 73.3287 13.3836 73.2757 13.4309C73.2227 13.4781 73.1604 13.5136 73.0927 13.5352C73.0251 13.5568 72.9536 13.5638 72.8831 13.556C72.8125 13.5481 72.7444 13.5255 72.6831 13.4896L71.9342 13.058C71.9196 13.0497 71.9054 13.0406 71.8917 13.0308C71.8375 12.9922 71.7915 12.9433 71.7562 12.8868C71.721 12.8304 71.6972 12.7676 71.6863 12.7021C71.6753 12.6365 71.6774 12.5694 71.6924 12.5046C71.7075 12.4398 71.7351 12.3786 71.7739 12.3245C72.1548 11.8045 72.6708 11.3983 73.266 11.1498C73.1259 10.5204 72.796 9.94904 72.3207 9.51269C71.8112 9.90219 71.2046 10.1449 70.5667 10.2144C70.5484 10.2164 70.53 10.2175 70.5116 10.2176H70.5094C70.3747 10.2177 70.2454 10.1644 70.15 10.0695C70.0545 9.97459 70.0006 9.84577 70 9.71124V8.84684C70.0001 8.82836 70.0011 8.80989 70.0031 8.79152C70.0106 8.72503 70.0311 8.66066 70.0635 8.60209C70.0959 8.54352 70.1395 8.4919 70.1919 8.45019C70.2443 8.40847 70.3044 8.37747 70.3688 8.35896C70.4332 8.34045 70.5006 8.3348 70.5672 8.34232C71.2049 8.41206 71.8113 8.65488 72.3207 9.04444C72.7961 8.60811 73.1261 8.03668 73.2662 7.40721C72.6714 7.16074 72.1556 6.75613 71.775 6.23738C71.7335 6.17983 71.7045 6.11421 71.69 6.04477C71.6755 5.97534 71.6758 5.90363 71.6909 5.83431C71.7059 5.76499 71.7353 5.6996 71.7773 5.64238C71.8193 5.58515 71.8728 5.53737 71.9345 5.50214L72.6839 5.06851C72.6981 5.0603 72.7132 5.05244 72.7286 5.04538C72.8508 4.98991 72.99 4.9851 73.1157 5.03203C73.2415 5.07895 73.3434 5.17377 73.3993 5.29568C73.599 5.74391 73.7017 6.22926 73.7004 6.71989C73.7004 6.87148 73.6907 7.02291 73.6714 7.17326C73.9764 7.26901 74.2943 7.3178 74.614 7.31795C74.616 7.31795 74.6179 7.31795 74.62 7.31795C74.9414 7.31782 75.2609 7.26853 75.5673 7.17179C75.483 6.53419 75.5764 5.88572 75.8372 5.29768C75.8447 5.28104 75.8532 5.26481 75.8624 5.24907C75.9304 5.13361 76.0415 5.04985 76.1713 5.0162C76.3011 4.98255 76.439 5.00177 76.5546 5.06963L77.3012 5.5026C77.3143 5.51001 77.3276 5.5186 77.3406 5.52778C77.4502 5.60541 77.5245 5.72328 77.5473 5.85554C77.57 5.9878 77.5393 6.12366 77.4618 6.23333C77.0818 6.75229 76.5668 7.15749 75.9726 7.40501C76.1136 8.03427 76.4429 8.60579 76.9169 9.04359C77.4262 8.65378 78.0329 8.41123 78.6708 8.34243C78.6897 8.34023 78.7087 8.33918 78.7277 8.33927C78.8625 8.33931 78.9918 8.39273 79.0873 8.48782C79.1827 8.5829 79.2365 8.7119 79.2369 8.84654V9.71128C79.2368 9.73 79.2358 9.7487 79.2337 9.7673C79.2262 9.83373 79.2057 9.89802 79.1733 9.95652C79.1409 10.015 79.0973 10.0666 79.045 10.1082C78.9926 10.1499 78.9326 10.1808 78.8682 10.1993C78.8039 10.2177 78.7366 10.2234 78.6701 10.2158C78.0325 10.1447 77.4263 9.90137 76.9169 9.51195C76.7985 9.62102 76.6886 9.73883 76.588 9.86438C76.2856 10.2398 76.0736 10.6796 75.9682 11.1498C76.5643 11.396 77.0806 11.802 77.4602 12.3229C77.4706 12.3374 77.4803 12.3525 77.4892 12.368C77.5557 12.4846 77.5732 12.6228 77.5377 12.7523C77.5022 12.8818 77.4167 12.9919 77.3 13.0584L76.5515 13.4902C76.5367 13.4988 76.5216 13.5066 76.506 13.5137C76.4405 13.5435 76.3694 13.559 76.2974 13.559ZM75.9094 11.5146C75.8541 12.0614 75.9416 12.6132 76.1634 13.1161C76.1799 13.1511 76.2095 13.1782 76.2458 13.1915C76.2822 13.2048 76.3223 13.2033 76.3575 13.1872C76.3622 13.1851 76.3667 13.1827 76.3711 13.1801L77.1213 12.7475C77.1383 12.738 77.1532 12.7252 77.1652 12.7098C77.1772 12.6945 77.1861 12.677 77.1913 12.6582C77.1965 12.6394 77.1979 12.6198 77.1955 12.6005C77.1931 12.5812 77.1868 12.5625 77.1772 12.5456C77.1747 12.5413 77.172 12.5372 77.1693 12.5332C76.8458 12.0894 76.4114 11.7382 75.9094 11.5146ZM73.3249 11.5153C73.1225 11.6065 72.9301 11.7185 72.751 11.8495C72.4882 12.0412 72.2568 12.2723 72.0648 12.5346C72.0426 12.5665 72.034 12.6059 72.0406 12.6441C72.0473 12.6823 72.0687 12.7164 72.1003 12.739C72.1043 12.7419 72.1085 12.7445 72.1129 12.747L72.8636 13.1796C72.8802 13.1895 72.8987 13.196 72.9178 13.1987C72.937 13.2015 72.9564 13.2004 72.9752 13.1956C72.9939 13.1908 73.0115 13.1824 73.027 13.1708C73.0425 13.1592 73.0555 13.1447 73.0653 13.128C73.0679 13.1236 73.0703 13.119 73.0724 13.1143C73.2508 12.7131 73.3424 12.2787 73.3412 11.8397C73.3413 11.7314 73.3359 11.6231 73.325 11.5153H73.3249ZM74.6101 10.8812C74.9545 10.8815 75.2972 10.9313 75.6275 11.0291C75.748 10.5213 75.9804 10.0467 76.3079 9.63999C76.4108 9.51165 76.5224 9.39056 76.6419 9.27758C76.1422 8.80441 75.7915 8.19595 75.6328 7.52673C75.3045 7.62597 74.9634 7.67645 74.6205 7.67655H74.6139C74.2729 7.67645 73.9337 7.62657 73.6071 7.5285C73.4491 8.19814 73.0976 8.80669 72.5963 9.27858C73.0974 9.75037 73.4487 10.3587 73.6068 11.028C73.9323 10.9305 74.2703 10.8811 74.6101 10.8812H74.6101ZM77.2032 9.27762C77.6469 9.59818 78.1661 9.79858 78.7104 9.85929C78.7501 9.86379 78.79 9.85238 78.8212 9.82756C78.8367 9.81533 78.8496 9.80016 78.8592 9.78292C78.8687 9.76568 78.8747 9.74671 78.8769 9.72713C78.8775 9.72166 78.8779 9.71617 78.8778 9.71066V8.84704C78.8776 8.8074 78.8617 8.76946 78.8336 8.74151C78.8054 8.71356 78.7674 8.69787 78.7277 8.69787C78.722 8.69745 78.7164 8.69778 78.7109 8.69887C78.1665 8.75749 77.6468 8.95698 77.2032 9.27762ZM70.5097 8.69775C70.4726 8.69779 70.4369 8.71144 70.4093 8.73609C70.3817 8.76074 70.3642 8.79468 70.36 8.83142C70.3594 8.83686 70.3591 8.84233 70.3591 8.84781V9.71055C70.3595 9.75007 70.3755 9.78785 70.4036 9.81567C70.4317 9.84349 70.4697 9.85911 70.5092 9.85914C70.5149 9.85934 70.5206 9.859 70.5262 9.85814C71.0706 9.79881 71.5902 9.59907 72.0339 9.27854C71.5905 8.95804 71.0713 8.75825 70.5272 8.69879C70.5214 8.69811 70.5155 8.69776 70.5097 8.69775ZM72.9387 5.35845C72.9176 5.35843 72.8968 5.36296 72.8776 5.37171C72.8731 5.37372 72.8687 5.37599 72.8645 5.37849L72.113 5.81332C72.079 5.83271 72.0541 5.86482 72.0437 5.90257C72.0334 5.94033 72.0385 5.98064 72.0579 6.01465C72.0605 6.01928 72.0633 6.02355 72.0663 6.02772C72.3905 6.46926 72.8244 6.81885 73.325 7.04206C73.3359 6.93494 73.3413 6.82733 73.3413 6.71966C73.3426 6.2798 73.2507 5.84464 73.0719 5.44269C73.06 5.4174 73.0412 5.39602 73.0176 5.38109C72.994 5.36616 72.9666 5.3583 72.9387 5.35845ZM76.2985 5.35845C76.2729 5.35844 76.2478 5.36511 76.2256 5.3778C76.2034 5.39049 76.1849 5.40875 76.1719 5.43078C76.1693 5.4352 76.167 5.43976 76.1648 5.44442C75.9428 5.94522 75.856 6.49534 75.913 7.04005C76.4132 6.81597 76.8465 6.46575 77.1702 6.02382C77.1921 5.99185 77.2005 5.95257 77.1935 5.91448C77.1866 5.87638 77.165 5.84254 77.1333 5.82026C77.1294 5.8176 77.1256 5.81513 77.1217 5.81289L76.3735 5.37923C76.3508 5.36581 76.3249 5.3587 76.2985 5.35864V5.35845Z"
                fill="#344461"
              />
              <path
                d="M10.9612 9V7.184H11.9692C12.6812 7.184 13.0012 7.52 13.0012 8.096C13.0012 8.656 12.6812 9 11.9692 9H10.9612ZM13.9372 8.096C13.9372 7.192 13.2892 6.44 11.9692 6.44H10.0492V12H10.9612V9.744H11.9692C13.4172 9.744 13.9372 8.888 13.9372 8.096ZM20.183 9.208C20.183 7.544 18.927 6.368 17.343 6.368C15.775 6.368 14.503 7.544 14.503 9.208C14.503 10.88 15.775 12.056 17.343 12.056C18.927 12.056 20.183 10.88 20.183 9.208ZM15.439 9.208C15.439 7.952 16.239 7.168 17.343 7.168C18.447 7.168 19.247 7.952 19.247 9.208C19.247 10.464 18.447 11.264 17.343 11.264C16.239 11.264 15.439 10.464 15.439 9.208ZM22.2085 12.008L23.2325 12L24.4725 7.792L25.6405 12H26.6725L28.3205 6.44H27.3445L26.1845 10.944L25.0245 6.44H24.0005L22.7525 10.968L21.6005 6.44H20.6325L22.2085 12.008ZM32.1447 6.432H29.0727V12H32.1447V11.256H29.9847V9.552H31.9047V8.808H29.9847V7.176H32.1447V6.432ZM36.22 8.104C36.22 8.656 35.9 9.048 35.188 9.048H34.18V7.184H35.188C35.9 7.184 36.22 7.544 36.22 8.104ZM33.268 6.44V12H34.18V9.776H34.876L36.156 12H37.244L35.868 9.696C36.804 9.464 37.156 8.76 37.156 8.104C37.156 7.2 36.508 6.44 35.188 6.44H33.268ZM41.3947 6.432H38.3227V12H41.3947V11.256H39.2347V9.552H41.1547V8.808H39.2347V7.176H41.3947V6.432ZM44.334 6.44H42.518V12H44.334C46.118 12 47.286 10.952 47.286 9.24C47.286 7.52 46.118 6.44 44.334 6.44ZM43.43 11.256V7.184H44.334C45.646 7.184 46.35 7.968 46.35 9.24C46.35 10.504 45.646 11.256 44.334 11.256H43.43ZM53.404 10.408C53.404 10.944 53.028 11.256 52.412 11.256H51.18V9.52H52.38C52.988 9.52 53.404 9.856 53.404 10.408ZM53.26 7.984C53.26 8.496 52.9 8.776 52.308 8.776H51.18V7.184H52.308C52.9 7.184 53.26 7.48 53.26 7.984ZM54.316 10.504C54.316 9.84 53.836 9.248 53.244 9.144C53.78 8.952 54.188 8.544 54.188 7.872C54.188 7.088 53.564 6.44 52.388 6.44H50.268V12H52.492C53.628 12 54.316 11.352 54.316 10.504ZM56.675 9.984V12H57.587V9.984L59.427 6.44H58.419L57.131 9.168L55.843 6.44H54.827L56.675 9.984Z"
                fill="#344461"
              />
              <rect
                x="0.4"
                y="0.4"
                width="129.2"
                height="18.2"
                rx="4.11402"
                stroke="#344461"
                strokeWidth="0.8"
              />
            </svg>
          </div> */}
        </div>
      </StyledContent>
    </StyledDiv>
  );
};

export default DashboardBuilder;
