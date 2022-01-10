import { BASE_URL, userConstants } from '../constants';
import { createStorageHelper } from '../extension';

const tokenStorage=createStorageHelper("token", {
  defaultValue: null,
})

const initialState={
   user:null,
   token:null,
    loading:false,
    error:''
}
export function globalStorage(state = initialState, action) {
  switch (action.type) {
      case userConstants.LOGIN:
        return {
          ...state,
    error:'',
          token:null,
          user:null,
          loading:true
        }
      case userConstants.REGISTER:
        return {
          ...state,
          error:'',
          token:null,
          user:null,
          loading:true
        }
      case userConstants.LOGOUT:
       tokenStorage.set(null);

        return {
          ...state,
          token:null,
          user:null
        }
      case userConstants.LOGIN_ERROR:
        return {
          ...state,
          token:null,
          user:null,
          error:action.data,
          loading:false
        }
      case userConstants.LOGIN_SUCCESS:
        tokenStorage.set(action.data.key)
         

          return {
              ...state,
              token: action.data.key,
              loading:false
          };
      case userConstants.GET_USER_SUCCESS:
        return {
          ...state,
          user:action.data,
          loading:false

        }
    default:
      return state
  }
}
