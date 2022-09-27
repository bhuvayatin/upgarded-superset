import React, { useEffect, useState } from 'react';
import { GoogleLogin } from 'react-google-login';
import { gapi } from 'gapi-script';

interface IProps {
  setauth: any;
}

function AuthPage({ setauth }: IProps) {
  const [googleauth, setGoogleauth] = useState('');
  useEffect(() => {
    function start() {
      gapi.client.init({
        clientId:
          // '584474271268-pobfv7jf8fniqagdr0947kqmg9qo9qlc.apps.googleusercontent.com', // Live credentials
          '914750947758-chhqq1237lb9hhpm7vs79mlaa892dc7s.apps.googleusercontent.com', // Loca credentials
        scope:
          'https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.metadata.readonly',

        flow: 'auth-code',
      });
    }

    gapi.load('client:auth2', start);
  }, []);

  // **you can access the token like this**
  // const accessToken = gapi.auth.getToken().access_token;
  // console.log(accessToken);

  const onSuccess = (response: any) => {
    console.log('SUCCESS', response.code);
    setGoogleauth(response.code);
    setauth(response.code);
  };
  const onFailure = (response: any) => {
    console.log('FAILED', response);
  };
  return (
    <div>
      <GoogleLogin
        buttonText={googleauth ? 'Logged In' : 'Login With Google'}
        // clientId="584474271268-pobfv7jf8fniqagdr0947kqmg9qo9qlc.apps.googleusercontent.com" // Live credentials
        clientId="914750947758-chhqq1237lb9hhpm7vs79mlaa892dc7s.apps.googleusercontent.com" // Loca credentials
        onSuccess={onSuccess}
        onFailure={onFailure}
        responseType="code"
        accessType="offline"
        prompt="consent"
      />
    </div>
  );
}

export default AuthPage;
