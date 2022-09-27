import React, { useEffect, useState } from 'react';
import { Modal, Button, notification, Input } from 'antd';
import { SupersetClient } from '@superset-ui/core';
import TextArea from 'antd/lib/input/TextArea';

interface IProps {
  addprojectmodal: boolean;
  setAddprojectmodal: (val: boolean) => void;
  setTableLoadfun: any;
}

function AddProjectmodal({
  addprojectmodal,
  setAddprojectmodal,
  setTableLoadfun,
}: IProps) {
  const [loadings, setLoadings] = useState(false);
  const [titlevalue, setTitlevalue] = React.useState('');
  const [projectdetail, setProjectdetail] = React.useState('');
  const [projectbyid, setProjectbyid] = React.useState<any>([]);
  const [disabled, setdisabled] = React.useState(false);
  const [errormsg, setErrormsg] = React.useState('');

  // Fro get Project details By ID
  const updateprojectid = localStorage.getItem('projectdetailid');

  // Get Project Data
  useEffect(() => {
    if (updateprojectid) {
      const endpoint = `/api/v1/project/${updateprojectid}`;
      SupersetClient.get({ endpoint }).then(({ json }) => {
        const { result } = json;
        setProjectbyid(result);
        setdisabled(true);
        setProjectdetail(result?.descr);
      });
    }
  }, []);
  //  Add Data In Database
  const onSubmitHandle = (e: any) => {
    setLoadings(true);
    if (updateprojectid) {
      setTableLoadfun(true);
      SupersetClient.put({
        endpoint: `/api/v1/project/${updateprojectid}`,
        jsonPayload: {
          descr: projectdetail,
        },
      })
        .then(response => {
          setLoadings(false);
          notification.success({
            message: 'Project Updated',
          });
          setTableLoadfun(true);
          setAddprojectmodal(false);
        })
        .catch(function (error) {
          notification.error({
            message: 'Project Not Updated',
          });
        });
    } else {
      SupersetClient.post({
        endpoint: `/api/v1/project/`,
        jsonPayload: {
          name: titlevalue,
          descr: projectdetail,
        },
      })
        .then(response => {
          notification.success({
            message: 'Project Added',
          });
          setLoadings(false);
          setTableLoadfun(true);
          setAddprojectmodal(false);
        })
        .catch(function (error) {
          error.json().then(function (err: any) {
            console.log(
              '🚀 ~ file: AddProjectmodal.tsx ~ line 80 ~ onSubmitHandle ~ error',
              err.message,
            );
            if (err?.message?.name) {
              notification.error({
                message: err?.message?.name,
              });
              setErrormsg(err?.message?.name);
            } else if (err?.message) {
              notification.error({
                message: err?.message,
              });
              setErrormsg(err?.message);
            }
          });
          setLoadings(false);
        });
    }
    e.preventDefault();
  };

  function oncanclehandler() {
    // Modal.confirm({
    //   icon: false,
    //   title: 'Please save first other wise your data may be lost',
    //   // content: 'Bla bla ...',
    //   onOk: () => {
    //     setAddprojectmodal(false);
    //   },
    //   okText: 'Ok',
    //   cancelText: 'Cancel',
    //   centered: true,
    // });
    setAddprojectmodal(false);
  }

  // Project Title Handler
  const titleHandle = (event: any) => {
    setTitlevalue(event.target.value);
    setErrormsg('');
  };

  // Popup Title
  const Title = (
    <div className="flex justify-between w-95 align-center">
      <div className="flex justify-center align-center">
        <h3 className="title">
          {updateprojectid ? projectbyid.name : 'Add New Project'}
        </h3>
      </div>
    </div>
  );

  return (
    <>
      <Modal
        title={Title}
        centered
        visible={addprojectmodal}
        onCancel={oncanclehandler}
        width={1000}
        className="pop-up"
        footer={null}
      >
        <form>
          <div className="project-detail">
            <div className="input-group mb-5 w-100">
              <div className="input-label my-3">
                <div className="tabledatatitle">
                  Project Name<span className="red">*</span>
                </div>
              </div>
              <div className="input" id="input-project">
                <Input
                  type="text"
                  placeholder="Enter the name of the project"
                  className={
                    updateprojectid ? 'form-input form-disable' : 'form-input'
                  }
                  onChange={titleHandle}
                  value={updateprojectid ? projectbyid.name : titlevalue}
                  disabled={disabled}
                />
                {errormsg ? <p className="text-danger">{errormsg}</p> : null}
              </div>
            </div>
          </div>
          <div className="mb-5">
            <div className="project-detail-card">
              <div className="flex justify-space">
                <div className="flex">
                  <div className="tabledatatitle">
                    <p>Description</p>
                  </div>
                </div>
              </div>
              <TextArea
                className="text-gray input-group mb-5"
                rows={8}
                placeholder="Deatils of the project"
                onChange={(e: any) => {
                  setProjectdetail(e.target.value);
                }}
                value={projectdetail}
              />
            </div>
          </div>
          <Button
            htmlType="submit"
            loading={loadings}
            className="btn-blue-popup m-r-10"
            onClick={onSubmitHandle}
          >
            {updateprojectid ? 'Save Changes' : 'Save'}
          </Button>
          <Button className="btn-white-popup" onClick={oncanclehandler}>
            Cancel
          </Button>
        </form>
      </Modal>
    </>
  );
}

export default AddProjectmodal;
