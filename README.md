# jquery.simplegauge v0.9.0

[![GitHub issues](https://img.shields.io/github/issues/peterthoeny/jquery.simplegauge)](https://github.com/peterthoeny/jquery.simplegauge/issues)
[![GitHub stars](https://img.shields.io/github/stars/peterthoeny/jquery.simplegauge)](https://github.com/peterthoeny/jquery.simplegauge/stargazers)
[![GitHub license](https://img.shields.io/github/license/peterthoeny/jquery.simplegauge)](https://github.com/peterthoeny/jquery.simplegauge/blob/master/LICENSE)

jquery.simplegauge is a simple jQuery plugin to show an analog and/or digital gauge.

## Getting Started

```
<link href="/path/to/jquery.simplegauge/jquery.simplegauge.css" type="text/css" rel="stylesheet">
<script src="https://code.jquery.com/jquery-latest.js" type="text/javascript" charset="utf-8"></script>
<script src="/path/to/jquery.simplegauge/jquery.simplegauge.js" type="text/javascript" charset="utf-8"></script>

<div id="demoGauge"></div>

<script>
$(document).ready(function() {
  var conf = {
    min: 0,
    max: 100,
    value: 65
  };
  $('#demoGauge').simpleGauge(conf);
});
</script>
```

## Configuration

Pass a configuration object to `.simpleGauge()`:

```
{
    FIXME
}
```

## Demo

See [demo.html](https://peterthoeny.github.io/jquery.simplegauge/demo.html)

// EOF
