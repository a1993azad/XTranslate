import React from 'react';
import Login from './Login';
import Register from './Register';

const forms={
    login:'login',
    register:'register'
}
export default function Auth() {
    const [form,setForm]=React.useState(forms.login);
  return (
    <>
    {form===forms.login && <Login showRegister={()=>setForm(forms.register)}/>}
    {form===forms.register && <Register showLogin={()=>setForm(forms.login)}/>}
    </>
  );
}
