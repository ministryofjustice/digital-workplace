<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class News_and_features extends CI_Controller {
	public function index() {
    $this->mojozine();
	}

  public function mojozine() {
    $data = [
      'page'=>'news_and_features/main',
      'top_class'=>'content-news-and-features',
      'tab_name'=>'mojozine'
    ];

		$this->load->view('v'.version().'/layouts/default', $data);
	}

  public function corporate_updates() {
    $data = [
      'page'=>'news_and_features/main',
      'top_class'=>'content-news-and-features',
      'tab_name'=>'corporate_updates'
    ];

		$this->load->view('v'.version().'/layouts/default', $data);
	}

  public function calendar() {
    $data = [
      'page'=>'news_and_features/main',
      'top_class'=>'content-news-and-features',
      'tab_name'=>'calendar'
    ];

		$this->load->view('v'.version().'/layouts/default', $data);
	}
}
