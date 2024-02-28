import React from 'react'
import { useAuth } from './'

export default {
  title: 'LoginButton',
  component: useAuth,
  argTypes: {}
}

const Template = (args) => <useAuth {...args} />

export const LoginButton = Template.bind({})
LoginButton.args = {
  baseUrl: '',
  loginEndPoint: '',
  refreshEndPoint: '',
  tokenStorage: 'token',
  providers: [
    {
      name: 'Google',
      authClientID:
        '1004747005329-17u8bctnfgj0cpb4ristu58m1flp9bmq.apps.googleusercontent.com'
    },
    {
      name: 'Apple',
      authClientID: 'your-apple-client-id'
    },
    {
      name: 'Microsoft',
      authClientID: 'your-microsoft-client-id'
    }
  ]
}
