use chrono::{DateTime, TimeZone, Utc};
use neon::prelude::{FunctionContext, JsNumber, JsString};
use crate::errors::StateManagerError;

pub fn if_not_empty(s: String) -> Option<String> {
  if s.len() > 0 {
    Some(s)
  } else {
    None
  }
}

pub fn if_time(ts: u64) -> Option<DateTime<Utc>> {
  if ts > 0 {
    Some(Utc.timestamp_millis(ts as i64))
  } else {
    None
  }
}

pub fn blockchain_from_code<S: AsRef<str>>(code: S) -> Result<u32, StateManagerError> {
  match code.as_ref().to_ascii_uppercase().as_str() {
    "BTC" => Ok(1),
    "ETH" => Ok(100),
    "ETC" => Ok(101),
    "TESTBTC" => Ok(10003),
    "GOERLI" => Ok(10005),
    _ => Err(StateManagerError::InvalidValue("Invalid blockchain code".to_string()))
  }
}

pub fn blockchain_to_code(id: u32) -> Result<String, StateManagerError> {
  match id {
    1 => Ok("BTC".to_string()),
    100 => Ok("ETH".to_string()),
    101 => Ok("ETC".to_string()),
    10003 => Ok("TESTBTC".to_string()),
    10005 => Ok("GOERLI".to_string()),
    _ => Err(StateManagerError::InvalidValue("Invalid blockchain id".to_string()))
  }
}

pub fn args_get_str(cx: &mut FunctionContext, pos: i32) -> Option<String> {
  match cx.argument_opt(pos) {
    None => None,
    Some(v) => {
      if v.is_a::<JsString, _>(cx) {
        match v.downcast::<JsString, _>(cx) {
          Ok(v) => Some(v.value(cx)),
          Err(_) => None,
        }
      } else {
        None
      }
    }
  }
}

pub fn args_get_number(cx: &mut FunctionContext, pos: i32) -> Option<f64> {
  match cx.argument_opt(pos) {
    None => None,
    Some(v) => {
      if v.is_a::<JsNumber, _>(cx) {
        match v.downcast::<JsNumber, _>(cx) {
          Ok(v) => Some(v.value(cx)),
          Err(_) => None,
        }
      } else {
        None
      }
    }
  }
}
