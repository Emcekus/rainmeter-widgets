-- Battery widget: percentage, gauge, and CHG while plugged in.
local PT, num, mPct, mAC, gaugeDir
local shownFill, shownAC = -1, -1

function Initialize()
  local res = SKIN:GetVariable('@')
  PT = dofile(res .. 'Scripts\\pixeltext.lua')
  num = PT.new{ prefix = 'MeterNum', slots = 4, cell = tonumber(SKIN:GetVariable('Cell')),
                glyphs = dofile(res .. 'Scripts\\glyphs_bat.lua'), dir = res .. 'Images\\Battery\\big\\' }
  gaugeDir = res .. 'Images\\Battery\\gauge\\'
  mPct = SKIN:GetMeasure('MeasureBattery')
  mAC = SKIN:GetMeasure('MeasureACLine')
end

function Update()
  local pct = PT.round(math.max(0, math.min(100, mPct:GetValue())))
  num:draw(tostring(pct) .. '%', 1)
  local fill = PT.round(78 * pct / 100)
  if fill ~= shownFill then
    SKIN:Bang('!SetOption', 'MeterGauge', 'ImageName', gaugeDir .. fill .. '.png')
    shownFill = fill
  end
  local ac = mAC:GetValue() >= 1 and 1 or 0
  if ac ~= shownAC then
    SKIN:Bang(ac == 1 and '!ShowMeter' or '!HideMeter', 'MeterCharging')
    shownAC = ac
  end
  return pct
end
