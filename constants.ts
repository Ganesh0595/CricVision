import { Player, Match, Gender, PlayerRole } from './types';

// Data parsed from the provided PDF
const playersFromPdf = [
  { id: 'p1', fullName: 'Rahul H', jerseyNumber: 27, email: 'rahulh1@bccpune.com', dob: '05-10-1980', gender: 'Male', role: 'Bowler' },
  { id: 'p2', fullName: 'Amol G', jerseyNumber: 96, email: 'amolg2@bccpune.com', dob: '05-08-1986', gender: 'Male', role: 'All-Rounder' },
  { id: 'p3', fullName: 'Shree P', jerseyNumber: 96, email: 'shreep3@bccpune.com', dob: '14-02-1998', gender: 'Male', role: 'Batter' },
  { id: 'p4', fullName: 'Ganesh A', jerseyNumber: 18, email: 'ganesha@gmail.com', dob: '10-05-1995', gender: 'Male', role: 'Batter' },
  { id: 'p5', fullName: 'Ab', jerseyNumber: 17, email: 'ab5@bccpune.com', dob: '21-11-1993', gender: 'Male', role: 'Batter' },
  { id: 'p6', fullName: 'Pravin A', jerseyNumber: 21, email: 'pravina8@bccpune.com', dob: '22-07-1999', gender: 'Male', role: 'All-Rounder' },
  { id: 'p7', fullName: 'Prem', jerseyNumber: 22, email: 'prem7@bccpune.com', dob: '10-09-1995', gender: 'Male', role: 'Batter' },
  { id: 'p8', fullName: 'Akash H', jerseyNumber: 14, email: 'akashh9@bccpune.com', dob: '26-04-1994', gender: 'Male', role: 'Bowler' },
  { id: 'p9', fullName: 'Shantanu', jerseyNumber: 11, email: 'shantanu2@bccpune.com', dob: '07-03-1990', gender: 'Male', role: 'All-Rounder' },
  { id: 'p10', fullName: 'Pravin R', jerseyNumber: 1, email: 'pravinr21@bccpune.com', dob: '19-12-1990', gender: 'Male', role: 'All-Rounder' },
  { id: 'p11', fullName: 'V.V.T', jerseyNumber: 2003, email: 'vvt22@bccpune.com', dob: '25-06-1987', gender: 'Male', role: 'All-Rounder' },
  { id: 'p12', fullName: 'Vk', jerseyNumber: 18, email: 'vk12@bccpune.com', dob: '21-11-1993', gender: 'Male', role: 'Batter' },
  { id: 'p13', fullName: 'Sopan', jerseyNumber: 94, email: 'sopan13@bccpune.com', dob: '26-04-1994', gender: 'Male', role: 'All-Rounder' },
  { id: 'p14', fullName: 'Swapnil R', jerseyNumber: 99, email: 'swapnilr14@bccpune.com', dob: '20-07-1991', gender: 'Male', role: 'All-Rounder' },
  { id: 'p15', fullName: 'Pj', jerseyNumber: 21, email: 'pj15@bccpune.com', dob: '06-11-1998', gender: 'Male', role: 'Batter' },
  { id: 'p16', fullName: 'Rahul T', jerseyNumber: 25, email: 'rahult16@bccpune.com', dob: '17-09-2002', gender: 'Male', role: 'Batter' },
  { id: 'p17', fullName: 'Sandy', jerseyNumber: 1, email: 'sandy17@bccpune.com', dob: '10-11-1987', gender: 'Male', role: 'All-Rounder' },
  { id: 'p18', fullName: 'Vishal D', jerseyNumber: 25, email: 'vishald23@bccpune.com', dob: '18-02-1991', gender: 'Male', role: 'Bowler' },
  { id: 'p19', fullName: 'Suraj', jerseyNumber: 29, email: 'suraj24@bccpune.com', dob: '23-08-2000', gender: 'Male', role: 'Batter' },
  { id: 'p20', fullName: 'Amit', jerseyNumber: 31, email: 'amit25@bccpune.com', dob: '15-07-2000', gender: 'Male', role: 'All-Rounder' },
  { id: 'p21', fullName: 'Tatya', jerseyNumber: 244, email: 'tatya26@bccpune.com', dob: '28-09-1982', gender: 'Male', role: 'Bowler' },
  { id: 'p22', fullName: 'Vinod', jerseyNumber: 99, email: 'vinod27@bccpune.com', dob: '16-05-1981', gender: 'Male', role: 'All-Rounder' },
  { id: 'p23', fullName: 'Pravin', jerseyNumber: 15, email: 'pravin29@bccpune.com', dob: '16-08-1990', gender: 'Male', role: 'All-Rounder' },
  { id: 'p24', fullName: 'Sangram', jerseyNumber: 7, email: 'sangram30@bccpune.com', dob: '11-03-1991', gender: 'Male', role: 'All-Rounder' },
  { id: 'p25', fullName: 'Amar', jerseyNumber: 1, email: 'amar31@bccpune.com', dob: '17-02-1985', gender: 'Male', role: 'All-Rounder' },
  { id: 'p26', fullName: 'Bittu', jerseyNumber: 21, email: 'bittu34@bccpune.com', dob: '25-06-1989', gender: 'Male', role: 'Batter' },
  { id: 'p27', fullName: 'Rakesh', jerseyNumber: 10, email: 'rakesh35@bccpune.com', dob: '21-02-1986', gender: 'Male', role: 'All-Rounder' },
  { id: 'p28', fullName: 'Ishkya', jerseyNumber: 37, email: 'ishkya36@bccpune.com', dob: '02-05-1994', gender: 'Male', role: 'Batter' },
  { id: 'p29', fullName: 'Prathames', jerseyNumber: 18, email: 'prathames29@bccpune.com', dob: '01-12-2004', gender: 'Male', role: 'All-Rounder' },
  { id: 'p30', fullName: 'Dushan', jerseyNumber: 33, email: 'dushan38@bccpune.com', dob: '02-02-1995', gender: 'Male', role: 'Batter' },
  { id: 'p31', fullName: 'Suhas', jerseyNumber: 3, email: 'suhas39@bccpune.com', dob: '06-12-1992', gender: 'Male', role: 'All-Rounder' },
  { id: 'p32', fullName: 'Ganesh P', jerseyNumber: 3, email: 'ganeshp40@bccpune.com', dob: '15-12-1990', gender: 'Male', role: 'All-Rounder' },
  { id: 'p33', fullName: 'Icon', jerseyNumber: 2003, email: 'icon42@bccpune.com', dob: '17-10-1988', gender: 'Male', role: 'All-Rounder' },
  { id: 'p34', fullName: 'Sagar', jerseyNumber: 7, email: 'sagar43@bccpune.com', dob: '11-11-1993', gender: 'Male', role: 'Bowler' },
  { id: 'p35', fullName: 'Nikhil', jerseyNumber: 7, email: 'nikhil44@bccpune.com', dob: '18-07-1992', gender: 'Male', role: 'All-Rounder' },
  { id: 'p36', fullName: 'Sagar M', jerseyNumber: 7, email: 'sagarm45@bccpune.com', dob: '26-04-1992', gender: 'Male', role: 'All-Rounder' },
  { id: 'p37', fullName: 'Vishal', jerseyNumber: 7, email: 'vishal46@bccpune.com', dob: '01-11-1993', gender: 'Male', role: 'Batter' },
  { id: 'p38', fullName: 'Palit', jerseyNumber: 2, email: 'palit47@bccpune.com', dob: '19-05-1986', gender: 'Male', role: 'Batter' },
  { id: 'p39', fullName: 'Dasharath', jerseyNumber: 14, email: 'dasharath39@bccpune.com', dob: '23-11-1985', gender: 'Male', role: 'All-Rounder' },
  { id: 'p40', fullName: 'Bunty', jerseyNumber: 1, email: 'bunty49@bccpune.com', dob: '09-08-2000', gender: 'Male', role: 'Bowler' },
  { id: 'p41', fullName: 'Soham', jerseyNumber: 777, email: 'soham51@bccpune.com', dob: '14-05-1988', gender: 'Male', role: 'All-Rounder' },
  { id: 'p42', fullName: 'Hanumant', jerseyNumber: 27, email: 'hanumant42@bccpune.com', dob: '07-05-1987', gender: 'Male', role: 'All-Rounder' },
  { id: 'p43', fullName: 'Ps', jerseyNumber: 173, email: 'ps54@bccpune.com', dob: '16-07-1993', gender: 'Male', role: 'All-Rounder' },
  { id: 'p44', fullName: 'Shubham', jerseyNumber: 11, email: 'shubham44@bccpune.com', dob: '09-06-1996', gender: 'Male', role: 'All-Rounder' },
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