<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

function version() {
  $CI =& get_instance();
  return $CI->input->get('v') ?: '1';
}
