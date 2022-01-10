import React, { EventHandler, FormEvent, ReactEventHandler } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerAction, loginError } from '../../actions/user';
import { getMessage } from '../../i18n';
import { Button } from '../button';
import { Dialog } from '../dialog';
export default function Register({showLogin}:{showLogin:any}) {
  const dispatch =useDispatch();
  const [form,setForm]=React.useState({username:'',password:'',phone:'',name:''})
  const {error,loading}=useSelector((state:any)=>({
    error:state.globalStorage.error,
    loading:state.globalStorage.loading
  }))
  const register=(e:FormEvent)=>{
    e.preventDefault();
    if(form.name.trim().length>1){
      if(form.username.trim().length>1){
        if(form.phone.length>=11 && form.phone.match(/^\+[1-9]\d+$/)){
          if(form.password.length>4){
            dispatch(registerAction(form))
          }else{
            dispatch(loginError(getMessage('password_min_invalid')))
          }
        }else{
          dispatch(loginError(getMessage('phone_is_invalid')))
        }
      }else{
        dispatch(loginError(getMessage('username_is_invalid')))

      }
    }else{
      dispatch(loginError(getMessage('name_is_invalid')))

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

    <form onSubmit={register} className='login'>
          <Dialog animated close={clearError} isOpen={!!error} className='rtl'>
            <h3 className='px-5 py-4 m-0'> 
              {error}
              </h3>
          </Dialog>
      <input type="tel" className='ltr text-end' name="phone" placeholder={getMessage('phone')} required value={form.phone} onChange={changeForm}/>
      <input type="text" className='ltr text-end' name="name" placeholder={getMessage('name')} required value={form.name} onChange={changeForm}/>
      <input type="text" className='ltr text-end' name="username" placeholder={getMessage('username')} required value={form.username} onChange={changeForm}/>
        <input type="password" className='ltr text-end' name="password" placeholder={getMessage("password")} required value={form.password} onChange={changeForm}/>
        <Button type="submit"  className="btn btn-primary d-block w-100 btn-large" waiting={loading} label={getMessage('signUp')}/>
        <Button  onClick={showLogin} className="btn btn-primary d-block w-100 btn-large mt-2" disabled={loading} label={getMessage('login')}/>

    </form>
  </div>
  </>
  );
}
    