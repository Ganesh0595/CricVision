import { Player, Match, Gender, PlayerRole } from './types';

// Player data for the application
const playersFromPdf = [
  { id: 'p4', fullName: 'Ganesh Ambhore', jerseyNumber: 18, email: 'ganesha@gmail.com', dob: '10-05-1995', gender: 'Male', role: 'Batter' },
  { id: 'p101', fullName: 'Nilesh Khengare', jerseyNumber: 1, email: 'nileshkhengare1@bccpune.com', dob: '01-01-1985', gender: 'Male', role: 'Batter' },
  { id: 'p102', fullName: 'Jadhav Saheb', jerseyNumber: 4, email: 'jadhavsaheb2@bccpune.com', dob: '02-02-1986', gender: 'Male', role: 'Bowler' },
  { id: 'p103', fullName: 'Sharad Jagtap', jerseyNumber: 7, email: 'sharadjagtap3@bccpune.com', dob: '03-03-1987', gender: 'Male', role: 'All-Rounder' },
  { id: 'p104', fullName: 'Sandip Dhotre', jerseyNumber: 10, email: 'sandipdhotre4@bccpune.com', dob: '04-04-1988', gender: 'Male', role: 'Batter' },
  { id: 'p105', fullName: 'Sachin Raut', jerseyNumber: 13, email: 'sachinraut5@bccpune.com', dob: '05-05-1989', gender: 'Male', role: 'Bowler' },
  { id: 'p106', fullName: 'Anil Panchal', jerseyNumber: 16, email: 'anilpanchal6@bccpune.com', dob: '06-06-1990', gender: 'Male', role: 'All-Rounder' },
  { id: 'p107', fullName: 'Shambhu Katpale', jerseyNumber: 19, email: 'shambhukatpale7@bccpune.com', dob: '07-07-1991', gender: 'Male', role: 'Batter' },
  { id: 'p108', fullName: 'Abhishek Rajput', jerseyNumber: 22, email: 'abhishekrajput8@bccpune.com', dob: '08-08-1992', gender: 'Male', role: 'Bowler' },
  { id: 'p109', fullName: 'Ajit Bandre', jerseyNumber: 25, email: 'ajitbandre9@bccpune.com', dob: '09-09-1993', gender: 'Male', role: 'All-Rounder' },
  { id: 'p110', fullName: 'Rohit Wanve', jerseyNumber: 28, email: 'rohitwanve10@bccpune.com', dob: '10-10-1994', gender: 'Male', role: 'Batter' },
  { id: 'p111', fullName: 'Omkar Salunkhe', jerseyNumber: 31, email: 'omkarsalunkhe11@bccpune.com', dob: '11-11-1995', gender: 'Male', role: 'Bowler' },
  { id: 'p112', fullName: 'Pritam More', jerseyNumber: 34, email: 'pritammore12@bccpune.com', dob: '12-12-1996', gender: 'Male', role: 'All-Rounder' },
  { id: 'p113', fullName: 'Mayur Chavan', jerseyNumber: 37, email: 'mayurchavan13@bccpune.com', dob: '13-01-1997', gender: 'Male', role: 'Batter' },
  { id: 'p114', fullName: 'Arvind Dodmise', jerseyNumber: 40, email: 'arvinddodmise14@bccpune.com', dob: '14-02-1998', gender: 'Male', role: 'Bowler' },
  { id: 'p115', fullName: 'Vikram Jagtap', jerseyNumber: 43, email: 'vikramjagtap15@bccpune.com', dob: '15-03-1999', gender: 'Male', role: 'All-Rounder' },
  { id: 'p116', fullName: 'Rutik Ghag', jerseyNumber: 46, email: 'rutikghag16@bccpune.com', dob: '16-04-2000', gender: 'Male', role: 'Batter' },
  { id: 'p117', fullName: 'Kiran Jadhav', jerseyNumber: 49, email: 'kiranjadhav17@bccpune.com', dob: '17-05-2001', gender: 'Male', role: 'Bowler' },
  { id: 'p118', fullName: 'Shubham Kuchekar', jerseyNumber: 52, email: 'shubhamkuchekar18@bccpune.com', dob: '18-06-2002', gender: 'Male', role: 'All-Rounder' },
  { id: 'p119', fullName: 'Vijay Chavan', jerseyNumber: 55, email: 'vijaychavan19@bccpune.com', dob: '19-07-2003', gender: 'Male', role: 'Batter' },
  { id: 'p120', fullName: 'Vijay Singh', jerseyNumber: 58, email: 'vijaysingh20@bccpune.com', dob: '20-08-1985', gender: 'Male', role: 'Bowler' },
  { id: 'p121', fullName: 'Sunil', jerseyNumber: 61, email: 'sunil21@bccpune.com', dob: '21-09-1986', gender: 'Male', role: 'All-Rounder' },
  { id: 'p122', fullName: 'Vaibhav Shirke', jerseyNumber: 64, email: 'vaibhavshirke22@bccpune.com', dob: '22-10-1987', gender: 'Male', role: 'Batter' },
  { id: 'p123', fullName: 'Ambadas Suryawanshi', jerseyNumber: 67, email: 'ambadassuryawanshi23@bccpune.com', dob: '23-11-1988', gender: 'Male', role: 'Bowler' },
  { id: 'p124', fullName: 'Vishal Varankar', jerseyNumber: 70, email: 'vishalvarankar24@bccpune.com', dob: '24-12-1989', gender: 'Male', role: 'All-Rounder' },
  { id: 'p125', fullName: 'Deepak Jadhav', jerseyNumber: 73, email: 'deepakjadhav25@bccpune.com', dob: '25-01-1990', gender: 'Male', role: 'Batter' },
  { id: 'p126', fullName: 'Appa Londhe', jerseyNumber: 76, email: 'appalondhe26@bccpune.com', dob: '26-02-1991', gender: 'Male', role: 'Bowler' },
  { id: 'p127', fullName: 'Avinash', jerseyNumber: 79, email: 'avinash27@bccpune.com', dob: '27-03-1992', gender: 'Male', role: 'All-Rounder' },
  { id: 'p128', fullName: 'Dattabhau', jerseyNumber: 82, email: 'dattabhau28@bccpune.com', dob: '28-04-1993', gender: 'Male', role: 'Batter' },
  { id: 'p129', fullName: 'Mahesh Mane', jerseyNumber: 85, email: 'maheshmane29@bccpune.com', dob: '01-05-1994', gender: 'Male', role: 'Bowler' },
  { id: 'p130', fullName: 'Bharatsir', jerseyNumber: 88, email: 'bharatsir30@bccpune.com', dob: '02-06-1995', gender: 'Male', role: 'All-Rounder' },
  { id: 'p131', fullName: 'Vinod Dhadas', jerseyNumber: 91, email: 'vinoddhadas31@bccpune.com', dob: '03-07-1996', gender: 'Male', role: 'Batter' },
  { id: 'p132', fullName: 'Ketan', jerseyNumber: 94, email: 'ketan32@bccpune.com', dob: '04-08-1997', gender: 'Male', role: 'Bowler' },
  { id: 'p133', fullName: 'Amit Jagtap', jerseyNumber: 97, email: 'amitjagtap33@bccpune.com', dob: '05-09-1998', gender: 'Male', role: 'All-Rounder' },
  { id: 'p134', fullName: 'Shree Tandale', jerseyNumber: 0, email: 'shreetandale34@bccpune.com', dob: '06-10-1999', gender: 'Male', role: 'Batter' },
  { id: 'p135', fullName: 'Dilip Atole', jerseyNumber: 3, email: 'dilipatole35@bccpune.com', dob: '07-11-2000', gender: 'Male', role: 'Bowler' },
  { id: 'p136', fullName: 'Mangesh Kurde', jerseyNumber: 6, email: 'mangeshkurde36@bccpune.com', dob: '08-12-2001', gender: 'Male', role: 'All-Rounder' },
  { id: 'p137', fullName: 'Mayur Patil', jerseyNumber: 9, email: 'mayurpatil37@bccpune.com', dob: '09-01-2002', gender: 'Male', role: 'Batter' },
  { id: 'p138', fullName: 'Dr. Nilesh', jerseyNumber: 12, email: 'drnilesh38@bccpune.com', dob: '10-02-2003', gender: 'Male', role: 'Bowler' },
  { id: 'p139', fullName: 'Sachin Talawade', jerseyNumber: 15, email: 'sachintalawade39@bccpune.com', dob: '11-03-1985', gender: 'Male', role: 'All-Rounder' },
  { id: 'p140', fullName: 'Rajkumar Shinde', jerseyNumber: 18, email: 'rajkumarshinde40@bccpune.com', dob: '12-04-1986', gender: 'Male', role: 'Batter' },
  { id: 'p141', fullName: 'Sangram Sangudi', jerseyNumber: 21, email: 'sangramsangudi41@bccpune.com', dob: '13-05-1987', gender: 'Male', role: 'Bowler' },
  { id: 'p142', fullName: 'Chandrkant Kale', jerseyNumber: 24, email: 'chandrkantkale42@bccpune.com', dob: '14-06-1988', gender: 'Male', role: 'All-Rounder' },
  { id: 'p143', fullName: 'Satywan Chavan', jerseyNumber: 27, email: 'satywanchavan43@bccpune.com', dob: '15-07-1989', gender: 'Male', role: 'Batter' },
  { id: 'p144', fullName: 'Nana Kunjir', jerseyNumber: 30, email: 'nanakunjir44@bccpune.com', dob: '16-08-1990', gender: 'Male', role: 'Bowler' },
  { id: 'p145', fullName: 'Purvesh Kakade', jerseyNumber: 33, email: 'purveshkakade45@bccpune.com', dob: '17-09-1991', gender: 'Male', role: 'All-Rounder' },
  { id: 'p146', fullName: 'Snehdeep Karkar', jerseyNumber: 36, email: 'snehdeepkarkar46@bccpune.com', dob: '18-10-1992', gender: 'Male', role: 'Batter' },
  { id: 'p147', fullName: 'Pawan Chouhan', jerseyNumber: 39, email: 'pawanchouhan47@bccpune.com', dob: '19-11-1993', gender: 'Male', role: 'Bowler' },
  { id: 'p148', fullName: 'Patil', jerseyNumber: 42, email: 'patil48@bccpune.com', dob: '20-12-1994', gender: 'Male', role: 'All-Rounder' },
];


/**
 * Converts a date string from DD-MM-YYYY to YYYY-MM-DD format.
 * @param dateStr The date string in DD-MM-YYYY format.
 * @returns The date string in YYYY-MM-DD format.
 */
const formatDate = (dateStr: string): string => {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr; // Return original if format is not as expected
};

export const MOCK_PLAYERS: Player[] = playersFromPdf.map((p, index) => {
  const sr = index + 1;
  return {
    id: p.id,
    fullName: p.fullName,
    jerseyNumber: p.jerseyNumber,
    email: p.email,
    dob: formatDate(p.dob),
    gender: p.gender as Gender,
    role: p.role as PlayerRole,
    state: 'Maharashtra',
    country: 'India',
    photoUrl: `https://picsum.photos/seed/${p.fullName.replace(/\s/g, '')}${sr}/200`,
    registrationDate: p.id === 'p4' ? formatDate('20-05-2024') : formatDate('01-01-2023'),
  };
});


export const MOCK_MATCHES: Match[] = [];

export const MATCH_FEE_PER_PLAYER = 100;

export const COUNTRIES = ['Afghanistan', 'Australia', 'Bangladesh', 'England', 'India', 'New Zealand', 'Pakistan', 'South Africa'];
export const INDIAN_STATES = ['Maharashtra', 'Gujarat', 'Karnataka', 'Tamil Nadu', 'Delhi', 'Punjab'];
export const PLAYER_ROLES = Object.values(PlayerRole);