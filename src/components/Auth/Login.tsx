import React, { EventHandler, FormEvent, ReactEventHandler } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginAction, loginError } from '../../actions/user';
import { getMessage } from '../../i18n';
import { Button } from '../button';
import { Dialog } from '../dialog';
export default function Login({showRegister}:{showRegister:any}) {
  const dispatch =useDispatch();
  const [form,setForm]=React.useState({username:'',password:''})
  const {error,loading}=useSelector((state:any)=>({
    error:state.globalStorage.error,
    loading:state.globalStorage.loading
  }))
  const login=(e:FormEvent)=>{
    e.preventDefault();
    if(form.username.length>=11 && form.username.match(/^\+[1-9]\d+$/)){
      if(form.password.length>4){
        dispatch(loginAction(form))
      }else{
        dispatch(loginError(getMessage('password_min_invalid')))
      }
    }else{
      dispatch(loginError(getMessage('username_is_invalid')))
    }
  }
  const changeForm=(e:any)=>{
    const {name,value}=e.target;
    setForm({...form,[name]:value})
  }
  const clearError=()=>{
    dispatch(loginError(null))

  }
  React.useEffect(()=>{
    clearError()
  },[1])
  return (<>
  <div className="formWrapper">

    <form onSubmit={login} className='login'>
          <Dialog animated close={clearError} isOpen={!!error} className='rtl'>
            <h3 className='px-5 py-4 m-0'> 
              {error}
              </h3>
          </Dialog>
      <input type="tel" className='ltr text-end' name="username" placeholder={getMessage('username')} required value={form.username} onChange={changeForm}/>
        <input type="password" className='ltr text-end' name="password" placeholder={getMessage("password")} required value={form.password} onChange={changeForm}/>
        <Button type="submit"  className="btn btn-primary d-block w-100 btn-large" waiting={loading} label={getMessage('signIn')}/>
        <Button  onClick={showRegister} className="btn btn-primary d-block w-100 btn-large mt-2" disabled={loading} label={getMessage('subscribe')}/>
   
    </form>

  </div>
  </>
  );
}
    