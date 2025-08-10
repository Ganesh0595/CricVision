
import React from 'react';

const Highlight: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200 px-1.5 py-1 rounded-md font-semibold">
        {children}
    </span>
);

const RuleSection: React.FC<{ children: React.ReactNode, title: string }> = ({ children, title }) => (
    <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-slate-300 dark:border-slate-600">{title}</h2>
        <div className="space-y-4 text-slate-700 dark:text-slate-300">
            {children}
        </div>
    </div>
);

const RuleSubSection: React.FC<{ num: string, title: string, children?: React.ReactNode }> = ({ num, title, children }) => (
    <div className="mt-6">
        <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">{num} {title}</h3>
        {children && <div className="space-y-3">{children}</div>}
    </div>
);

const SubRule: React.FC<{ num: string, children: React.ReactNode }> = ({ num, children }) => (
    <div className="pl-4">
        <p><strong className="font-semibold text-slate-800 dark:text-slate-200">{num}</strong> {children}</p>
    </div>
);

const RuleList: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ul className="list-disc pl-6 space-y-2">{children}</ul>
);

const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="my-2 p-3 bg-slate-100 dark:bg-slate-700/50 border-l-4 border-orange-500 rounded-r-md">
        <p><strong className="font-semibold">Note:</strong> {children}</p>
    </div>
);


export const rulesData = [
  {
    id: 'preamble',
    title: 'Preamble - The Spirit of Cricket',
    content: (
      <RuleSection title="Preamble - The Spirit of Cricket">
        <p>Cricket owes much of its appeal and enjoyment to the fact that it should be played not only according to the Laws but also within the <Highlight>Spirit of Cricket</Highlight>.</p>
        <p>The major responsibility for ensuring fair play rests with the captains, but extends to all players, match officials and, especially in junior cricket, teachers, coaches and parents.</p>
        <RuleList>
            <li>Respect is central to the Spirit of Cricket.</li>
            <li>Respect your captain, team-mates, opponents and the authority of the umpires.</li>
            <li>Play hard and play fair.</li>
            <li>Accept the umpire's decision.</li>
            <li>Create a positive atmosphere by your own conduct, and encourage others to do likewise.</li>
            <li>Show self-discipline, even when things go against you.</li>
            <li>Congratulate the opposition on their successes, and enjoy those of your own team.</li>
        </RuleList>
      </RuleSection>
    ),
  },
  {
    id: 'rule1',
    title: '1. The Players',
    content: (
        <RuleSection title="1. The Players">
            <RuleSubSection num="1.1" title="Number of players">
                <p>A match is played between two sides, each of eleven players, one of whom shall be captain.</p>
            </RuleSubSection>
            <RuleSubSection num="1.2" title="Nomination and replacement of players">
                <SubRule num="1.2.1">Each captain shall nominate 11 players plus a maximum of 4 substitute fielders in writing to the ICC Match Referee before the toss. No player may be changed after nomination without the opposing captain's consent.</SubRule>
                <SubRule num="1.2.7">A <Highlight>Concussion Replacement</Highlight> may be permitted if a player sustains a concussion during the match, subject to approval by the ICC Match Referee.</SubRule>
            </RuleSubSection>
        </RuleSection>
    ),
  },
  {
    id: 'rule2',
    title: '2. The Umpires',
    content: (
        <RuleSection title="2. The Umpires">
            <RuleSubSection num="2.1" title="Appointment and attendance">
                 <SubRule num="2.1.1">The umpires shall control the game with absolute impartiality.</SubRule>
                 <SubRule num="2.1.2">Match Officials include an ICC Match Referee, two on-field umpires, a third umpire, and a fourth umpire.</SubRule>
            </RuleSubSection>
            <RuleSubSection num="2.7" title="Fitness for play"><p>It is solely for the umpires to decide if conditions of ground, weather or light are dangerous or unreasonable for play to take place.</p></RuleSubSection>
            <RuleSubSection num="2.12" title="Umpire's decision"><p>An umpire may alter a decision promptly, provided it does not contradict the Dead ball rule. Otherwise, an <Highlight>umpire's decision, once made, is final</Highlight>.</p></RuleSubSection>
            <RuleSubSection num="2.13" title="Signals"><p>A specific code of signals is used by umpires, including signals for <Highlight>No ball</Highlight>, <Highlight>Out</Highlight>, <Highlight>Wide</Highlight>, <Highlight>Dead ball</Highlight>, <Highlight>Boundary 4</Highlight>, <Highlight>Boundary 6</Highlight>, and <Highlight>Free Hit</Highlight>.</p></RuleSubSection>
        </RuleSection>
    ),
  },
  { id: 'rule3', title: '3. The Scorers', content: (<RuleSection title="3. The Scorers"><RuleSubSection num="3.1" title="Appointment of scorers"><p>Two scorers shall be appointed to record all runs scored and wickets taken.</p></RuleSubSection><RuleSubSection num="3.2" title="Correctness of scores"><p>Scorers shall frequently check to ensure their records agree and consult with the umpires if necessary.</p></RuleSubSection></RuleSection>)},
  { id: 'rule4', title: '4. The Ball', content: (<RuleSection title="4. The Ball"><RuleSubSection num="4.1" title="Weight and size"><p>A white ball must be used. It shall weigh between 5.5 and 5.75 ounces (155.9g and 163g).</p></RuleSubSection><RuleSubSection num="4.3" title="New ball"><p>Each fielding team shall have two new balls for its innings, to be used in alternate overs.</p></RuleSubSection></RuleSection>)},
  { id: 'rule5', title: '5. The Bat', content: (<RuleSection title="5. The Bat"><RuleSubSection num="5.1" title="The bat"><p>The bat consists of a handle and a blade, made of wood.</p></RuleSubSection><RuleSubSection num="5.7" title="Bat size limits"><p>The overall length shall not be more than 38 in/96.52 cm, and the blade shall not exceed 4.25in / 10.8 cm in width.</p></RuleSubSection></RuleSection>)},
  { id: 'rule6', title: '6. The Pitch', content: (<RuleSection title="6. The Pitch"><RuleSubSection num="6.1" title="Area of pitch"><p>The pitch is a rectangular area 22 yards/20.12 m in length and 10 ft/3.05 m in width.</p></RuleSubSection><RuleSubSection num="6.2" title="Fitness of pitch for play"><p>The umpires are the sole judges of the fitness of the pitch for play.</p></RuleSubSection></RuleSection>)},
  { id: 'rule7', title: '7. The Creases', content: (<RuleSection title="7. The Creases"><RuleSubSection num="7.1" title="The creases"><p>A bowling crease, popping crease, and two return creases shall be marked at each end of the pitch.</p></RuleSubSection></RuleSection>)},
  { id: 'rule8', title: '8. The Wickets', content: (<RuleSection title="8. The Wickets"><RuleSubSection num="8.1" title="Description, width and pitching"><p>Two sets of wickets, each 9 in/22.86 cm wide and consisting of three wooden stumps with two wooden bails on top, shall be pitched opposite and parallel to each other.</p></RuleSubSection></RuleSection>)},
  { id: 'rule9', title: '9. Preparation and Maintenance of the Playing Area', content: (<RuleSection title="9. Preparation and Maintenance of the Playing Area"><RuleSubSection num="9.1" title="Rolling"><p>The pitch may be rolled for not more than 7 minutes before the start of the second innings at the request of the batting captain.</p></RuleSubSection></RuleSection>)},
  { id: 'rule10', title: '10. Covering the Pitch', content: (<RuleSection title="10. Covering the Pitch"><p>The pitch shall be entirely protected against rain before and during the match.</p></RuleSection>)},
  { id: 'rule11', title: '11. Intervals', content: (<RuleSection title="11. Intervals"><p>There shall be a 30-minute interval between innings. Two drinks breaks per session are also permitted.</p></RuleSection>)},
  { id: 'rule12', title: '12. Start of Play; Cessation of Play', content: (<RuleSection title="12. Start of Play; Cessation of Play"><p>The bowler's end umpire shall call 'Play' to start the match and 'Time' to end a session.</p></RuleSection>)},
  { id: 'rule13', title: '13. Innings', content: (<RuleSection title="13. Innings"><RuleSubSection num="13.6" title="Duration of Match"><p>All matches will consist of one innings per side, each limited to a maximum of <Highlight>50 overs</Highlight>.</p></RuleSubSection><Note>In delayed or interrupted matches, the number of overs may be reduced.</Note></RuleSection>)},
  { id: 'rule14', title: '14. The Follow-on', content: (<RuleSection title="14. The Follow-on"><p>Shall not apply in One Day Internationals.</p></RuleSection>)},
  { id: 'rule15', title: '15. Declaration and Forfeiture', content: (<RuleSection title="15. Declaration and Forfeiture"><p>Shall not apply in One Day Internationals.</p></RuleSection>)},
  { id: 'rule16', title: '16. The Result', content: (<RuleSection title="16. The Result"><RuleSubSection num="16.1" title="A Win"><p>The side which scores more runs than the opposing side in its one completed innings shall win the match.</p></RuleSubSection><RuleSubSection num="16.3" title="A Tie"><p>If the scores are equal after both innings, a <Highlight>Super Over</Highlight> shall be played to determine the winner.</p></RuleSubSection><RuleSubSection num="16.4" title="Calculation of the Target Score"><p>In interrupted matches, the <Highlight>Duckworth-Lewis-Stern (DLS) method</Highlight> is used to set a revised target score.</p></RuleSubSection></RuleSection>)},
  { id: 'rule17', title: '17. The Over', content: (<RuleSection title="17. The Over"><p>An over consists of 6 valid balls bowled from one end. No balls and wides do not count as valid balls.</p></RuleSection>)},
  { id: 'rule18', title: '18. Scoring Runs', content: (<RuleSection title="18. Scoring Runs"><p>A run is scored when the batters, at any time while the ball is in play, have crossed and made good their ground from end to end.</p></RuleSection>)},
  { id: 'rule19', title: '19. Boundaries', content: (<RuleSection title="19. Boundaries"><p>6 runs are scored if the ball, having been struck by the bat, crosses the boundary on the full. 4 runs are scored if it crosses the boundary after touching the ground.</p></RuleSection>)},
  { id: 'rule20', title: '20. Dead Ball', content: (<RuleSection title="20. Dead Ball"><p>The ball becomes dead when it is finally settled in the hands of the wicket-keeper or bowler, a boundary is scored, or a batter is dismissed.</p></RuleSection>)},
  {
    id: 'rule21',
    title: '21. No Ball',
    content: (
        <RuleSection title="21. No Ball">
            <p>A <Highlight>No ball</Highlight> results in one penalty run to the batting side, and an extra delivery must be bowled. Any runs scored from a No ball (off the bat, byes or leg byes) are scored in addition to the penalty. The delivery following a No ball is a <Highlight>Free Hit</Highlight>.</p>
            <RuleSubSection num="21.1" title="Mode of delivery">
                <SubRule num="21.1.1">The umpire shall call No ball if the bowler’s front foot lands with no part of it, grounded or in the air, behind the popping crease.</SubRule>
                <SubRule num="21.1.2">The umpire shall call No ball if the bowler's back foot touches or crosses the return crease.</SubRule>
            </RuleSubSection>
            <RuleSubSection num="21.5" title="Fair delivery – the ball">
                <p>A delivery can be called a No ball for several reasons related to the ball's trajectory:</p>
                <RuleList>
                    <li>If the ball, without pitching, passes or would have passed <Highlight>above the waist height</Highlight> of the striker standing upright at the popping crease.</li>
                    <li>If the ball bounces more than once before it reaches the popping crease.</li>
                    <li>If the ball rolls along the ground before it reaches the striker.</li>
                    <li>If the ball comes to rest in front of the line of the striker’s wicket.</li>
                </RuleList>
            </RuleSubSection>
            <RuleSubSection num="21.6" title="Fielding restrictions">
                <p>A No ball is called if the fielding restrictions (Powerplays) are breached at the instant of delivery.</p>
            </RuleSubSection>
            <RuleSubSection num="21.10" title="Revoking a call of No ball">
                <p>An umpire may revoke a call of No ball if the ball does not leave the bowler’s hand for any reason.</p>
            </RuleSubSection>
        </RuleSection>
    ),
  },
  {
    id: 'rule22',
    title: '22. Wide Ball',
    content: (
        <RuleSection title="22. Wide Ball">
            <p>A <Highlight>Wide</Highlight> results in one penalty run to the batting side, and an extra delivery must be bowled. All runs completed by the batters or a boundary from a Wide shall be scored as Wides.</p>
            <RuleSubSection num="22.1" title="Judging a Wide">
                <SubRule num="22.1.1">If the bowler bowls a ball, not being a No ball, the umpire shall adjudge it a Wide if, according to the definition in 22.1.2, the ball passes wide of where the striker is standing and which also would have passed wide of the striker standing in a normal guard position.</SubRule>
                <SubRule num="22.1.2">The ball will be considered as passing wide of the striker unless it is sufficiently within reach for him/her to be able to hit it with the bat by means of a normal cricket stroke.</SubRule>
                <Note>In ODIs, white lines (Wide guidelines) are often painted on the pitch to assist the umpire's judgement for off-side wides.</Note>
            </RuleSubSection>
            <RuleSubSection num="22.4" title="Delivery not a Wide">
                <SubRule num="22.4.1">The umpire shall not adjudge a delivery as being a Wide if the striker, by moving, causes the ball to pass wide of him/her.</SubRule>
                <SubRule num="22.4.2">If the striker moves, and the ball would have been within their reach in their normal guard position, it is not a Wide.</SubRule>
            </RuleSubSection>
        </RuleSection>
    ),
  },
  { id: 'rule23', title: '23. Bye and Leg Bye', content: (<RuleSection title="23. Bye and Leg Bye"><p>Byes are runs scored when the ball does not touch the bat or batter. Leg byes are runs scored when the ball hits the batter's body, provided they attempted a stroke or were avoiding the ball.</p></RuleSection>)},
  { id: 'rule24', title: '24. Fielder\'s Absence; Substitutes', content: (<RuleSection title="24. Fielder's Absence; Substitutes"><p>A substitute is allowed for a fielder who is injured or ill. A substitute cannot bat, bowl, or act as captain.</p></RuleSection>)},
  { id: 'rule25', title: '25. Batter\'s Innings', content: (<RuleSection title="25. Batter's Innings"><p>A batter's innings commences when they first step onto the field of play. A batter may retire due to illness or injury and resume their innings later.</p></RuleSection>)},
  { id: 'rule26', title: '26. Practice on the Field', content: (<RuleSection title="26. Practice on the Field"><p>No practice is allowed on the pitch at any time. Practice on the outfield is permitted before play, after play, and during intervals.</p></RuleSection>)},
  { id: 'rule27', title: '27. The Wicket-keeper', content: (<RuleSection title="27. The Wicket-keeper"><p>The wicket-keeper is the only fielder permitted to wear gloves and external leg guards. They must remain wholly behind the wicket until the ball is played or passes the wicket.</p></RuleSection>)},
  {
    id: 'rule28',
    title: '28. The Fielder',
    content: (
        <RuleSection title="28. The Fielder">
            <p>Fielders may field the ball with any part of their person. However, a fielder cannot use their cap or any other part of their clothing to field the ball. It is unfair to wilfully obstruct a batter in running or to distract the striker.</p>
            <RuleSubSection num="28.7" title="Fielding restrictions">
                <p>In an uninterrupted 50-over innings, the fielding restrictions are applied in three Powerplays:</p>
                <RuleList>
                    <li><strong><Highlight>Powerplay 1 (Overs 1-10)</Highlight>:</strong> A maximum of two fielders are allowed outside the 30-yard circle. The fielding captain's team must have at least two stationary fielders (excluding the wicket-keeper) in close catching positions.</li>
                    <li><strong><Highlight>Powerplay 2 (Overs 11-40)</Highlight>:</strong> A maximum of four fielders are allowed outside the 30-yard circle.</li>
                    <li><strong><Highlight>Powerplay 3 (Overs 41-50)</Highlight>:</strong> A maximum of five fielders are allowed outside the 30-yard circle.</li>
                </RuleList>
                <Note>At the instant of delivery, there may not be more than 5 fielders on the leg side.</Note>
            </RuleSubSection>
        </RuleSection>
    ),
  },
  { id: 'rule29', title: '29. The Wicket is Broken', content: (<RuleSection title="29. The Wicket is Broken"><p>The wicket is broken if a bail is completely removed from the top of the stumps, or a stump is struck out of the ground by the ball, the striker's bat/person, or a fielder.</p></RuleSection>)},
  { id: 'rule30', title: '30. Batter out of His/Her Ground', content: (<RuleSection title="30. Batter out of His/Her Ground"><p>A batter is out of their ground unless some part of their person or bat is grounded behind the popping crease.</p></RuleSection>)},
  { id: 'rule31', title: '31. Appeals', content: (<RuleSection title="31. Appeals"><p>Umpires shall not give a batter out unless appealed to by a fielder. An appeal <Highlight>"How's That?"</Highlight> covers all ways of being out.</p></RuleSection>)},
  { id: 'rule32', title: '32. Bowled', content: (<RuleSection title="32. Bowled"><p>The striker is out <Highlight>Bowled</Highlight> if his wicket is broken by a ball delivered by the bowler, even if it first touches the bat or person.</p></RuleSection>)},
  { id: 'rule33', title: '33. Caught', content: (<RuleSection title="33. Caught"><p>The striker is out <Highlight>Caught</Highlight> if a ball delivered by the bowler touches his bat and is subsequently held by a fielder as a fair catch before it touches the ground.</p></RuleSection>)},
  { id: 'rule34', title: '34. Hit the Ball Twice', content: (<RuleSection title="34. Hit the Ball Twice"><p>The striker is out if they wilfully strike the ball a second time, except for the sole purpose of guarding their wicket.</p></RuleSection>)},
  { id: 'rule35', title: '35. Hit Wicket', content: (<RuleSection title="35. Hit Wicket"><p>The striker is out <Highlight>Hit Wicket</Highlight> if their bat or person breaks the wicket while preparing to receive or in receiving a delivery, or in setting off for a first run.</p></RuleSection>)},
  { id: 'rule36', title: '36. Leg Before Wicket', content: (<RuleSection title="36. Leg Before Wicket"><p>The striker is out <Highlight>LBW</Highlight> if the ball, without first touching the bat, intercepts any part of their person and would have gone on to hit the wicket.</p></RuleSection>)},
  { id: 'rule37', title: '37. Obstructing the field', content: (<RuleSection title="37. Obstructing the field"><p>Either batter is out if they wilfully attempt to <Highlight>obstruct or distract</Highlight> the fielding side by word or action.</p></RuleSection>)},
  { id: 'rule38', title: '38. Run Out', content: (<RuleSection title="38. Run Out"><p>Either batter is out <Highlight>Run out</Highlight> if they are out of their ground and their wicket is fairly broken by the action of a fielder.</p></RuleSection>)},
  { id: 'rule39', title: '39. Stumped', content: (<RuleSection title="39. Stumped"><p>The striker is out <Highlight>Stumped</Highlight> if they are out of their ground (not attempting a run) and the wicket is broken by the wicket-keeper without the intervention of another fielder.</p></RuleSection>)},
  { id: 'rule40', title: '40. Timed Out', content: (<RuleSection title="40. Timed Out"><p>An incoming batter must be ready to receive the next ball within <Highlight>2 minutes</Highlight> of the dismissal or retirement of the previous batter.</p></RuleSection>)},
  {
    id: 'rule41',
    title: '41. Unfair Play',
    content: (
        <RuleSection title="41. Unfair Play">
            <RuleSubSection num="41.2" title="Changing the condition of the ball">
                <p>It is unfair for anyone to rub the ball on the ground or use any artificial substance to alter its condition. A fielder may polish the ball, provided no artificial substance is used and it does not waste time.</p>
            </RuleSubSection>
            <RuleSubSection num="41.3" title="The match ball – changing its condition">
                <p>If the umpires find that the condition of the ball has been unfairly changed, they shall award a <Highlight>5-run penalty</Highlight> to the opposition and replace the ball.</p>
            </RuleSubSection>
            <RuleSubSection num="41.6" title="Bowling of dangerous and unfair short pitched deliveries">
                <p>The bowling of short pitched deliveries is dangerous if the umpire considers that, taking into consideration the skill of the striker, it is likely to inflict physical injury. A bowler is limited to <Highlight>two such deliveries per over</Highlight> that pass above shoulder height. Any more will be called a No ball.</p>
            </RuleSubSection>
            <RuleSubSection num="41.7" title="Bowling of dangerous and unfair non-pitching deliveries">
                <p>Any delivery which passes or would have passed, without pitching, above waist height of the striker standing upright at the popping crease is a No ball.</p>
            </RuleSubSection>
            <RuleSubSection num="41.9" title="Time wasting by the fielding side">
                <p>It is unfair for the fielding side to waste time. If they do, the umpires will issue warnings and can award a <Highlight>5-run penalty</Highlight>.</p>
            </RuleSubSection>
        </RuleSection>
    ),
  },
  { id: 'rule42', title: '42. Players\' Conduct', content: (<RuleSection title="42. Players' Conduct"><p>This rule deals with serious misconduct (Level 4 offences), such as threatening an umpire or physically assaulting another player, which can result in the player being <Highlight>removed from the field</Highlight> for the remainder of the match.</p></RuleSection>)},
];
