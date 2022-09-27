import React, { useEffect, useState } from 'react';
import { Modal, Switch, Button, Input, DatePicker } from 'antd';
import Select from 'packages/superset-ui-chart-controls/src/components/Select';
import moment from 'moment';
import { SupersetClient } from '@superset-ui/core';
import AuthPage from './AuthPage';

interface IProps {
  modalsourceVisible: boolean;
  setModalsourceVisible: (val: boolean) => void;
  getsourcepopupdata: any;
  dataid: number | any;
  sync_enabled: any;
  setPopupauth: any;
  source_type: string;
}
const { Option } = Select;
const { Search } = Input;

function Sourcepopup({
  modalsourceVisible,
  setModalsourceVisible,
  getsourcepopupdata,
  dataid,
  sync_enabled,
  setPopupauth,
  source_type,
}: IProps) {
  const Title = (
    <div className="flex justify-between w-95 align-center">
      <div className="flex justify-center align-center">
        <h4 className="title">Setup Source </h4>
      </div>
    </div>
  );
  const [selectsource, setSelectsource] = useState('Google Sheets');
  const [updatedata, setUpdatedata] = useState<any>([]);
  const [isdesabled, setIsdesabled] = useState(false);
  const [auth, setAuth] = useState('');

  const [sourcepopupdata, setSourcepopupdata] = useState({
    source_name: '',
    sheetid: '',
    sourcetype: '',
    ngsurveyid: '',
    ngauth: '',
  });
  const [surveylist, setSurveylist] = useState<any>([]);

  function handleChangesource(evt: any) {
    setSourcepopupdata({
      ...sourcepopupdata,
      [evt.target.name]: evt.target.value,
      sourcetype: selectsource,
    });
    evt.preventDefault();
  }

  function onSearch(value: string) {
    const endpoint = `/api/v1/ngconnection/survey/${value}`;
    SupersetClient.get({ endpoint })
      .then(({ json }) => {
        const { result } = json;
        setSurveylist(result);
      })
      .catch(function (error) {
        error.json().then(function (err: any) {
          console.log({ err });
        });
      });
    setSourcepopupdata({
      ...sourcepopupdata,
      ngauth: value,
    });
  }
  // Get survey list
  function getsurveylist(value: string) {
    setSourcepopupdata({
      ...sourcepopupdata,
      ngsurveyid: value,
    });
  }

  // Submit the form
  function onsubmit(e: any) {
    getsourcepopupdata(sourcepopupdata);
    setModalsourceVisible(false);
    e.preventDefault();
  }
  if (auth) {
    setPopupauth(auth);
  }

  console.log(
    '🚀 ~ file: Sourcepopup.tsx ~ line 70 ~ SupersetClient.get ~ result',
    sourcepopupdata,
  );

  useEffect(() => {
    if (dataid) {
      if (source_type === 'google_sheet') {
        const endpoint = `/api/v1/sync_db/${dataid}`;
        SupersetClient.get({ endpoint }).then(({ json }) => {
          const { result } = json;
          setUpdatedata(result);
          setSelectsource(result.source_name);
          setIsdesabled(!isdesabled);
        });
      } else if (source_type === 'ngsurvey') {
        const endpoint = `api/v1/ngconnection/${dataid}`;
        SupersetClient.get({ endpoint }).then(({ json }) => {
          const { result } = json;
          setUpdatedata(result);
          console.log(
            '🚀 ~ file: Sourcepopup.tsx ~ line 78 ~ SupersetClient.get ~ result',
            result,
          );
          setSelectsource(result.source_name);
          setIsdesabled(!isdesabled);
        });
      }
    }
  }, []);
  const selectsourcehandler = (value: any) => {
    setSelectsource(value);
    setSourcepopupdata({
      ...sourcepopupdata,
      sourcetype: value,
    });
  };
  // const spreadsheet_id: any =
  //   updatedata.connection.source.connectionConfiguration.spreadsheet_id;
  // const service_account_info: any =
  //   updatedata.connection.source.connectionConfiguration.credentials.service_account_info;
  return (
    <>
      {/* <button
        type="button"
        className="btn-source"
        onClick={() => setModalsourceVisible(true)}
      >
        {children}
      </button> */}
      <Modal
        title={Title}
        centered
        visible={modalsourceVisible}
        onOk={() => setModalsourceVisible(false)}
        onCancel={() => setModalsourceVisible(false)}
        width={1000}
        className="pop-up"
        footer={null}
      >
        <form onSubmit={onsubmit}>
          <div className="flex flex-column">
            <div className="sourc">
              <span>
                Name<span className="red">*</span>
              </span>
              - Pick a name to help you identify this source in Impact Cloud
            </div>
            <Input
              name="source_name"
              placeholder="Your source name"
              className="my-3"
              style={{ width: '60%' }}
              onChange={handleChangesource}
              value={
                dataid ? updatedata.database_name : sourcepopupdata.source_name
              }
              disabled={isdesabled}
              required
            />
          </div>
          <div>
            <div className="mb-3">
              <p>
                <span>Source Type</span>
              </p>
              <Select
                defaultValue={
                  selectsource !== null ? selectsource : 'Google Sheets'
                }
                className="select-sync"
                onChange={value => {
                  selectsourcehandler(value);
                }}
                disabled={isdesabled}
                // disabled={isdesabled}
              >
                <Option value="Google Sheets">Google Sheets</Option>
                <Option value="NGSurvey">Sopact Survey</Option>
                <Option value="SalesForce">SalesForce</Option>
              </Select>
            </div>
            {selectsource === 'Google Sheets' ? (
              <div className="relative mt-3 sourcecredentialsoutter">
                <div className="flex items-center absolute sourcecredentials">
                  <span className="m-r-10">Credentials</span>
                  <p
                    defaultValue="service key account"
                    className="select-syncp"
                  >
                    Authenticate via Google Type
                  </p>
                </div>
                <div className="mx-auto">
                  <div>
                    <AuthPage setauth={setAuth} />
                    <div className="sourc mt-3">
                      <span>
                        Google Sheet Id<span className="red">*</span>{' '}
                      </span>
                    </div>
                    <Input
                      name="sheetid"
                      className="my-3"
                      placeholder="https://docs.google.com/spreadsheets/d/1lN5z-9vliBmymwJ0WVA6YLI8WMdZWK8zO3bG-39LUqA/edit?usp=sharing"
                      onChange={handleChangesource}
                      required
                      value={
                        dataid
                          ? updatedata?.connection?.source
                              ?.connectionConfiguration?.spreadsheet_id
                          : sourcepopupdata.sheetid
                      }
                      disabled={isdesabled}
                    />
                  </div>
                </div>
              </div>
            ) : selectsource === 'SalesForce' ? (
              <>
                <div>
                  <div className="sourc">
                    <span>
                      api_type<span className="red">*</span>{' '}
                    </span>{' '}
                    -Unless you know that you are transferring a very small
                    amount of data, prefer using the BULK API. This will help
                    avoid using up all of your API call quota with Salesforce.
                    Valid values are BULK or REST.
                  </div>
                  <Select defaultValue="BULK" className="select-sync1 my-3">
                    <Option value="BULK">BULK</Option>
                    <Option value="REST">REST</Option>
                  </Select>
                </div>
                <div>
                  <div className="sourc">
                    <span>
                      Client_id<span className="red">*</span>{' '}
                    </span>{' '}
                    -The Consumer Key that can be found when viewing your app in
                    Salesforce
                  </div>
                  <Input name="cliend_id" className="my-3" />
                </div>
                <div className="my-3">
                  <div className="sourc">
                    <Switch className="m-r-1" />
                    <span>is_sandbox</span> Whether or not the app is in
                    Salesforce sandbox. If you do not know what this, assume it
                    is false, we provide more info on this field in this{' '}
                    <a>docs</a>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="sourc mb-3">
                    <span>
                      start_date<span className="red">*</span>
                    </span>{' '}
                    -UTC date and time in the format 2017-01-25T00:00:00Z. Any
                    data before this date will not be replicated.
                  </div>
                  <DatePicker
                    style={{ minWidth: '100%' }}
                    format="YYYY-MM-DD HH:mm:ss"
                    defaultValue={moment()}
                  />
                </div>
                <div>
                  <div className="sourc">
                    <span>
                      client_secret<span className="red">*</span>
                    </span>
                    -The Consumer Secret that can be found when viewing your app
                    in Salesforce
                  </div>
                  <Input.Password name="client_secret" className="my-3" />
                </div>
                <div>
                  <div className="sourc">
                    <span>
                      refresh_token<span className="red">*</span>
                    </span>
                    - Salesforce Refresh Token used for Airbyte to access your
                    Salesforce account. If you don't know what this is, follow
                    this <a>guide</a> to retrieve it.
                  </div>
                  <Input.Password name="refresh_token" className="my-3" />
                </div>
              </>
            ) : selectsource === 'NGSurvey' ? (
              <div className="relative mt-3 sourcecredentialsoutter">
                <div className="flex items-center absolute sourcecredentials">
                  <span className="m-r-10">Credentials</span>
                  <p
                    defaultValue="service key account"
                    className="select-syncp"
                  >
                    Authenticate via Sopact Survey ID
                  </p>
                </div>
                <div className="mx-auto">
                  <div>
                    <div className="sourc mt-3">
                      <span>
                        Sopact Survey Auth KEY<span className="red">*</span>{' '}
                      </span>
                    </div>
                    <Search
                      placeholder="Authentication code"
                      allowClear
                      enterButton="Get Survey"
                      size="large"
                      onSearch={onSearch}
                      // value={
                      //   dataid ? updatedata?.token : sourcepopupdata.ngauth
                      // }
                      disabled={isdesabled}
                    />
                    {/* <Input
                      name="ngauth"
                      className="my-3"
                      placeholder="Authentication code"
                      onChange={handleChangesource}
                      required
                      value={
                        dataid ? updatedata?.token : sourcepopupdata.ngauth
                      }
                      disabled={isdesabled}
                    /> */}
                  </div>
                  <div>
                    <div className="sourc mt-3">
                      <span>
                        Sopact Survey Id<span className="red">*</span>{' '}
                      </span>
                    </div>
                    <Select
                      showSearch
                      placeholder="Select a Sopact Survey"
                      optionFilterProp="children"
                      // onSearch={onSearchservey}
                      onChange={getsurveylist}
                      filterOption={(input, option) =>
                        (option!.children as unknown as string)
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      defaultValue={
                        dataid
                          ? updatedata?.survey_id
                          : sourcepopupdata?.ngsurveyid
                      }
                      disabled={isdesabled}
                    >
                      {surveylist?.map((row: any) => (
                        <Option value={row?.id}>{row?.title}</Option>
                      ))}
                    </Select>
                    {/* <Input
                      name="ngsurveyid"
                      className="my-3"
                      onChange={handleChangesource}
                      placeholder="Sopact Survey Id"
                      value={
                        dataid
                          ? updatedata?.survey_id
                          : sourcepopupdata.ngsurveyid
                      }
                      disabled={isdesabled}
                    /> */}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          <button type="submit" className="btn-blue-popup m-r-10">
            Setup Source
          </button>
          <Button
            className="btn-white-popup"
            onClick={() => {
              setModalsourceVisible(false);
            }}
          >
            Cancel
          </Button>
        </form>
      </Modal>
    </>
  );
}

export default Sourcepopup;
