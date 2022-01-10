import axios from "axios";
import { store } from "../utils/store";
import { userConstants } from "../constants";
import {  BASE_URL } from "../constants";
import { createStorageHelper } from "../extension";
const tokenStorage=createStorageHelper("token", {
    defaultValue: null,
  })
export const checkTokenAction=()=>{
    return dispatch=>{
          tokenStorage.whenReady.then(() => {
            const key=tokenStorage.get();
            console.log(key)
            if(key)
            dispatch({type:userConstants.LOGIN_SUCCESS,data:{key}})
           });
    }
}
export const getAuthAsync=()=>{
    return new Promise(resolve=>{

        tokenStorage.whenReady.then(() => {
            const key=tokenStorage.get();
            resolve({
                Authorization:'Token '+key
            })
        })
    })
}
export const getAuth=(token)=>{
    return {Authorization:'Token '+(token || store.getState().globalStorage.token)}
}
export function loginAction(data){
    return dispatch=>{
        dispatch({type:userConstants.LOGIN,data})
        axios.post(BASE_URL+'/auth/login/',data).then(res=>{
            dispatch({type:userConstants.LOGIN_SUCCESS,data:res.data})
        }).catch((e)=>{
           

                dispatch({type:userConstants.LOGIN_ERROR,data:e?.response?.data?.detail})
            
        })
    }
}
export function getProfileAction(token){
    return dispatch=>{
        const res=axios.get(BASE_URL+'/accounts/profile/',{headers:getAuth(token)})
        res.then(r=>{

            dispatch({type:userConstants.GET_USER_SUCCESS,data:r.data})
        }).catch((e)=>{
            if(e?.response?.status===401){
                dispatch(logoutAction())
            }
        })
        return res;
    }
}
export function registerAction(data){
    return dispatch=>{
        dispatch({type:userConstants.REGISTER,data})
        axios.post(BASE_URL+'/accounts/register/',data).then(res=>{
            dispatch(loginAction({username:data.phone,password:data.password}))
        }).catch((e)=>{
            dispatch({type:userConstants.LOGIN_ERROR,data:e?.response?.data?.detail})
        })
    }
}
export function loginError(e){
    return ({type:userConstants.LOGIN_ERROR,data:e})
}
export function logoutAction(){
    return ({type:userConstants.LOGOUT})
}