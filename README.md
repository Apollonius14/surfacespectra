Early work to visualise speech as a surface wave coming out of the mouth.

The height of the wave is a function of the phonetic specrogram, radial distance and angle from mouth centerline. 

For now a representative plosive, trill, vowel and fricative 100hz-8Khz

The grid on which the surface is plotted looks like the field of the olypic javelin

The spectogram (a table of say 1,000 time intervals, each with a row of 1,000 frequency bins in the phonic range) is passed to the grid line by line

With each frame update, the spectogram propagates radially outwards, and so by definition the arc over which the spectral powers are plotted gets wider

Currently going with a mirror symmetry, 100Hz along centerline and either side of javelin field (30 degrees) out to 8khz

**To do:**

The rate of spreading of frequencies along the legnth of the arc, and the relative scaling, should (A) affect height of that bin's power (B) vary to reflect atmospheric damping. Ie so the middle channel of 100Hz damps a lot slower than the wider channels.

Currently spectorgrams are not stored, they're dynamically calculated. Get the real ones from mic and use MEL bins etc.

When we've got enough of them, see the difference between saying C A T and CAT as a stream

When we've got all of them, think of a surface geology/ geography plot or game ie jagged edges for R, mountains for 6aa, rivers for 3 or 3'.
