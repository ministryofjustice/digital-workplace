<?php $this->load->view('v'.version().'/content/forms_and_templates/sub_header'); ?>

<div class="content grid grid-pad">
  <ul class="breadcrumbs">
    <li>
      <a href="homepage?v=<?=version()?>">Home</a>
    </li>
    <li>
      <a href="forms_and_templates?v=<?=version()?>">Forms &amp; templates</a>
    </li>
  </ul>

  <div class="lhs col-1-3">
    <div class="filter-by">
      <span class="form-label">Filter by:</span>
      <form>
        <select>
          <option>Categories</option>
          <option>Option 2</option>
          <option>Option 3</option>
        </select>
        <input type="text" placeholder="Forms &amp; templates" />
        <input type="submit" value="Search" />
      </form>
    </div>
  </div>

  <div class="col-2-3">
    <ul class="results">
      <li>
        <h2><a href="">Absence (short term) - invitation to case conference</a></h2>
        <ul class="item-path">
          <li>
            <a href="">Home</a>
          </li>
          <li>
            <a href="">HR</a>
          </li>
          <li>
            <a href="">Absence</a>
          </li>
        </ul>
        <p>Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Nam nibh. Nunc varius facilisis eros. Sed erat. In in velit quis</p>
      </li>
      <li>
        <h2><a href="">Long term absence - case conference invite letter</a></h2>
        <ul class="item-path">
          <li>
            <a href="">Home</a>
          </li>
          <li>
            <a href="">HR</a>
          </li>
          <li>
            <a href="">Absence</a>
          </li>
        </ul>
        <p>Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Nam nibh. Nunc varius facilisis eros. Sed erat. In in velit quis</p>
      </li>
      <li>
        <h2><a href="">Long term absence - final written warning letter</a></h2>
        <ul class="item-path">
          <li>
            <a href="">Home</a>
          </li>
          <li>
            <a href="">HR</a>
          </li>
          <li>
            <a href="">Absence</a>
          </li>
        </ul>
        <p>Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Nam nibh. Nunc varius facilisis eros. Sed erat. In in velit quis</p>
      </li>
    </ul>
  </div>
  <div class="col-2-3 push-1-3">
    <div class="more">
      <a href="">See all</a>
    </div>
  </div>
</div>
